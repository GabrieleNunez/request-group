import BaseWebRequest from '../core/base_web_request';
import Request from '../core/request';
import * as request from 'request';
import * as URL from 'url';

export class WebRequest extends BaseWebRequest<string> {

    protected userAgent: string | null;
    protected xml: boolean;

    public constructor(url: string, userAgent: string | null = null) {
        super(url);
        this.userAgent = userAgent;
        this.xml = false;
    }

    /**
     * Enables or disables xml mode on the request. If this method is called without true of false being specified then the default is true to turn it on.
     * By default xml mode is turned OFF on web request, so calling this method by doing request.setXMLMode(); will enable it on. request.setXMLMode(false) to turn it off
     * @param xmlMode 
     */
    public setXMLMode(xmlMode: boolean = true): void {
        this.xml = xmlMode;
    }

    /**
     * Properly dispose of any resources that we need to get rid of
     */
    public dispose(): Promise<void> {
        return new Promise((resolve): void => {
            resolve();
        });
    }

    /**
     * 
     */
    public run(): Promise<Request<string>> {
        return new Promise(async (resolve): Promise<void> => {

      
            resolve();
        });
    }
}
