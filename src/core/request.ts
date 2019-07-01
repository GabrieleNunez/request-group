/**
 * The Request interfaces provides an abstract way to interact with all the key features to help us to read/manipulate request data
 */
export interface Request<PageEngine> {
    /**
     * Ping this request. Note: Pinging this request will cause it to not be expired
     */
    ping(): void;

    /**
     * Determine if this request is expired
     */
    isExpired(): boolean;

    /**
     * Get the url that this request is pointing to currently
     */
    getUrl(): string;

    /**
     * Determine if this request is done running and can be safely manipulated
     */
    isDone(): boolean;

    /**
     * Write a supplied value to the specified key in our metadata cache on this request.
     * @param key Name of the metadata field we want to write to
     * @param value The value that we want to store at that metadata field matching to our key
     * @typeparam T1 the type we are expecting to write to the metadata field
     */
    setMetadata<T1>(key: string, value: T1): void;

    /**
     *
     * @param key Grab the value that matches our key
     * @typeparam T1 a type that specifies what we are expecting back from the metadata field
     */
    getMetadata<T1>(key: string): T1 | null;

    /**
     * Free up any resources used by the request. useful if dealing with
     */
    dispose(): Promise<void>;

    /**
     * Run the request
     */
    run(): Promise<Request<PageEngine>>;

    /**
     * Run the specified request at a new url
     * @param requestUrl The url to rerun the request
     */
    goto(requestUrl: string): Promise<Request<PageEngine>>;

    /**
     * Returns the output of the page as the PageEngine type that was specified. This allows you to read/manipulate it in anyway you want
     */
    getPage(): PageEngine;
}

export default Request;
