export default abstract class DBWrapper<T1, T2> {
    get(type: T1): Promise<T2> {
        return this.getOrCreate(type);
    }

    protected abstract getOrCreate(type: T1): Promise<T2>;
    protected abstract create(type: T1): Promise<T2>;

    save?(savedType: T2): Promise<T2>;
}