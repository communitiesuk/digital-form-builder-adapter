import { AdapterFormDefinition } from "@communitiesuk/model";

export function sortConditionsBySourceFieldOrder(data: AdapterFormDefinition): AdapterFormDefinition {
  const sortedData = { ...data };
  
  sortedData.pages = data.pages.map(page => {
    if (!page.next || page.next.length === 0) {
      return page;
    }

    // Find the source page that these conditions reference
    const sourcePagePath = getConditionSourcePage(page.next, data);
    if (!sourcePagePath) {
      return page; // No conditions to sort
    }

    const sourcePage = data.pages.find(p => p.path === sourcePagePath);
    if (!sourcePage) {
      return page;
    }

    // Get the order of options from the source field (checkboxes, etc.)
    const fieldOptionOrder = getFieldOptionOrder(sourcePage, data);
    
    // Sort conditions based on the order of options in the source field
    const sortedNext = [...page.next].sort((a, b) => {
      // Non-conditional links first
      if (!a.condition && !b.condition) return 0;
      if (!a.condition) return -1;
      if (!b.condition) return 1;

      // Get the option values these conditions check for
      const aOptionValue = getConditionOptionValue(a.condition, data);
      const bOptionValue = getConditionOptionValue(b.condition, data);

      // Sort by the order they appear in the source field
      const aIndex = fieldOptionOrder.indexOf(aOptionValue);
      const bIndex = fieldOptionOrder.indexOf(bOptionValue);

      // If both found, sort by their field order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // Fallback to alphabetical for any not found
      return a.path.localeCompare(b.path);
    });

    return {
      ...page,
      next: sortedNext
    };
  });

  return sortedData;
}

function getConditionSourcePage(nextLinks: any[], data: AdapterFormDefinition): string | null {
  // Find the first conditional link and determine what page it's checking
  const conditionalLink = nextLinks.find(link => link.condition);
  if (!conditionalLink) return null;

  const condition = data.conditions?.find(c => c.name === conditionalLink.condition);
  if (!condition?.value?.conditions?.[0]?.field?.name) return null;

  // Extract page path from field name (e.g., "FabDefault.ZRERCV" -> page with component "ZRERCV")
  const fieldName = condition.value.conditions[0].field.name;
  const componentName = fieldName.includes('.') ? 
    fieldName.split('.').pop() : fieldName;

  // Find the page that contains this component
  return data.pages.find(page => 
    page.components?.some(component => component.name === componentName)
  )?.path || null;
}

function getFieldOptionOrder(page: any, data: AdapterFormDefinition): string[] {
  // Find the checkboxes field (or other multi-select field)
  const checkboxField = page.components?.find(component => 
    component.type === 'CheckboxesField' || 
    component.type === 'RadiosField'
  );

  if (!checkboxField) return [];

  // If it uses a list reference, get the list
  if (checkboxField.values?.type === 'listRef') {
    const listName = checkboxField.values.list || checkboxField.list;
    const list = data.lists?.find(l => l.name === listName);
    return list?.items?.map(item => item.value) || [];
  }

  // If it has inline items
  return checkboxField.items?.map(item => item.value) || [];
}

function getConditionOptionValue(conditionName: string, data: AdapterFormDefinition): string {
  const condition = data.conditions?.find(c => c.name === conditionName);
  return condition?.value?.conditions?.[0]?.value?.value || '';
}