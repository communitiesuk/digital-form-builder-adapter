import SelectConditions, {
    ConditionData
} from "../../../digital-form-builder/designer/client/conditions/SelectConditions";
import {
    hasConditionName,
    isDuplicateCondition
} from "../../../digital-form-builder/designer/client/conditions/select-condition-helpers";
//@ts-ignore
import {Data} from "@xgovformbuilder/model";


interface Props {
    path: string;
    data: Data;
    conditionsChange: (selectedCondition: string) => void;
    hints: any[];
    noFieldsHintText?: string;
}

export class AdapterSelectConditions extends SelectConditions {

    constructor(props: Props, context) {
        super(props, context);
    }

    handleConditions(
        objectConditions: ConditionData[],
        fieldName: string,
        conditionsForPath: any[]
    ) {
        objectConditions.forEach((condition) => {
            //@ts-ignore
            condition.value.conditions?.forEach((innerCondition) => {
                this.checkAndAddCondition(
                    condition,
                    fieldName,
                    this.getFieldNameSubstring(innerCondition.field.name),
                    conditionsForPath
                );
            });
        });
    }

    // loops through nested conditions, checking the referenced condition against the current field
    handleNestedConditions(
        nestedConditions: ConditionData[],
        fieldName: string,
        conditionsForPath: any[]
    ) {
        nestedConditions.forEach((condition) => {
            //@ts-ignore
            condition.value.conditions.forEach((innerCondition) => {
                // if the condition is already in the conditions array, skip the for each loop iteration
                if (isDuplicateCondition(conditionsForPath, condition.name)) return;
                // if the inner condition isn't a nested condition, handle it in the standard way
                if (!hasConditionName(innerCondition)) {
                    this.checkAndAddCondition(
                        condition,
                        fieldName,
                        this.getFieldNameSubstring(innerCondition.field.name),
                        conditionsForPath
                    );
                    return;
                }
                //if the inner condition is a nested condition,
                //check if that nested condition is already in the conditions array,
                //and if so, add this condition to the array
                if (
                    isDuplicateCondition(conditionsForPath, innerCondition.conditionName)
                )
                    conditionsForPath.push(condition);
            });
        });
    }


    getFieldNameSubstring = (sectionFieldName: string) => {
        return sectionFieldName.substring(sectionFieldName.indexOf(".") + 1);
    };

}
