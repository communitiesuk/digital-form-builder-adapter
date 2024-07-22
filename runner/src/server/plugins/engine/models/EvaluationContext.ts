export class EvaluationContext {
    constructor(conditions, value) {
        Object.assign(this, value);

        for (const key in conditions) {
            Object.defineProperty(this, key, {
                get() {
                    return conditions[key].fn(value);
                },
            });
        }
    }
}
