import BaseRequest from './base_request';

/**
 * Certain methods that pertain strictly to the utilization of HTTP
 */
export type WebRequestMethods = 'GET' | 'POST';

/**
 * A way to store information about the form we are going to attempt to send up using whatever page engine is specified
 */
export interface WebRequestForm {
    [id: string]: string;
}

/**
 * An abstract class that represents what a base web request could potentially look like
 */
export abstract class BaseWebRequest<PageEngine> extends BaseRequest<PageEngine> {

    protected requestMethod: WebRequestMethods;
    protected requestForm: WebRequestForm;
    protected requestCookie: string;

    /**
		Construct our generic web request.
		Note: this generic web request has NO real world functionality
		It is shere to simply development of other web request
	*/
    public constructor(requestUrl: string) {
        super(requestUrl);
        this.requestMethod = 'GET';
        this.requestForm = {};
        this.requestCookie = '';
    }


    /**
     * Gets the current method being used in the web request
     */
    public getMethod(): WebRequestMethods {
        return this.requestMethod;
    }

    /**
     * Sets the web request method being used to the specified method
     * @param requestMethod The intended method to be used by the request
     */
    public setMethod(requestMethod: WebRequestMethods): void {
        this.requestMethod = requestMethod;
    }

    /**
     * Using the specified key, set the supplied value in our form object 
     * @param key The key that we want to point toward a field in the form object
     * @param value A value that we want to set the field to
     */
    public setForm(key: string, value: string): void {
        this.requestForm[key] = value;
    }

    /**
     * Using the specified key get the value that matches the key in our form storage
     * @param key The name of the field we want to retrieve in our form
     * @returns Either the string value of the form that matches the specified field or NULL if the key does not exist in our form
     */
    public getForm(key: string): string | null {
        return typeof this.requestForm[key] !== "undefined" ? this.requestForm[key] : null;
    }


    /**
     * Sets the request cookie to whatever value is specified
     * @param entireCookie The literal entire RAW cookie to pass and store
     */
    public setCookie(entireCookie: string): void {
        this.requestCookie = entireCookie;
    }

}

export default BaseWebRequest;