import Request from './request';
import * as moment from 'moment';

/**
 * The type of data allowed into our metadata
 * Right now this is set to `unknown` but this will most likely change in the future
 */
export type MetadataStorageType = unknown;

/**
 * A simple interface that conforms to a certain expectation of how we want our metadata to be stored
 * For now this may seem unneeded but this will most likely change in the future
 */
export interface MetadataStorage {
    [field: string]: MetadataStorageType;
}

export abstract class BaseRequest<PageEngine> implements Request<PageEngine> {
    protected requestCompleted: boolean;
    protected requestUrl: string;
    protected momentCreated: moment.Moment;
    protected momentInitiated: moment.Moment;
    protected momentDuration: moment.Duration;
    protected momentPing: moment.Moment;
    protected momentDone: moment.Moment;
    protected metadataStorage: MetadataStorage;
    protected requestErrors: string[];
    protected pageData: PageEngine | null;

    
    /**
		Construct our generic web request.
		Note: this generic web request has NO real world functionality
		It is shere to simply development of other web request
	*/
    public constructor(requestUrl: string) {
        this.momentCreated = moment();
        this.momentInitiated = moment();
        this.momentDuration = moment.duration();
        this.momentDone = moment();
        this.momentPing = moment();
        this.requestCompleted = false;
        this.metadataStorage = {};
        this.requestUrl = requestUrl;
        this.requestErrors = [];
        this.pageData = null;
    }

    /** Ping the request to set a timestamp. We can check this timestamp whenever we need to to determine if our request is stalling out */
    public ping(): void {
        this.momentPing = moment();
    }

    /** Determine if based off our last ping if this request is expired. Each request has 300 seconds between each ping before a request is considered expires */
    public isExpired(): boolean {
        return (moment().unix() - this.momentPing.unix()) > 60;
    }

    /**
    * 
    * @param key Grab the value that matches our key
    * @typeparam T1 a type that specifies what we are expecting back from the metadata field
    */
    public getMetadata<T1>(key: string): T1 | null {
        return typeof this.metadataStorage[key] !== "undefined" ? (this.metadataStorage[key] as T1) : null;
    }

    /**
    * Write a supplied value to the specified key in our metadata cache on this request. 
    * @param key Name of the metadata field we want to write to
    * @param value The value that we want to store at that metadata field matching to our key
    * @typeparam T1 the type we are expecting to write to the metadata field
    */
    public setMetadata<T1>(key: string, value: T1): void {
        this.metadataStorage[key] = value;
    }

    /** Gets the request url being used by the web request */
    public getUrl(): string {
        return this.requestUrl;
    }

    /** determins if the web request is done processing */
    public isDone(): boolean {
        return this.requestCompleted;
    }

    /** 
		Returns the duration of the request as a moment
		Note: if the request was not run, the duration will be the time the request was created
	*/
    public getDuration(): moment.Duration {
        return this.momentDuration;
    }

    /**
		Returns any errors. The default value of errors is null
	*/
    public getErrors(): string[] {
        return this.requestErrors;
    }

    /**
	*	Change the request url and run the request again
	*	Note: this DOES NOT close the request, so it is possible to reuse peristant resources again
	*/
    public goto(requestUrl: string): Promise<Request<PageEngine>> {
        this.requestUrl = requestUrl;
        return this.run();
    }

    /**
     * Returns the output of the page as the PageEngine type that was specified. This allows you to read/manipulate it in anyway you want
     */
    public getPage(): PageEngine {
        return this.pageData as PageEngine;
    }
    /**
    * Free up any resources used by the request. useful if dealing with 
    */
    public abstract dispose(): Promise<void>;

    /**
     * Run the request
     */
    public abstract run(): Promise<Request<PageEngine>>;
}

export default BaseRequest;