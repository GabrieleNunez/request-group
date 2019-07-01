import BaseWebRequest from '../core/base_web_request';
import Request from '../core/request';
import * as request from 'request';
import * as URL from 'url';
import moment = require('moment');
import { rejects } from 'assert';

export class WebRequest extends BaseWebRequest<string> {

    protected userAgent: string | null;
    public constructor(url: string, userAgent: string | null = null) {
        super(url);
        this.userAgent = userAgent;
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

        let urlTarget = URL.parse(this.requestUrl);
        let urlHost: string | undefined = urlTarget.hostname;
        return new Promise(async (resolve,reject): Promise<void> => {

            if(urlHost === undefined) {
                reject();
            } else {

                let headers = { 
                    'User-Agent' : this.userAgent,
                    'Connection' : 'keep-alive',
                    'Accept' : '*/*',
                    'Host' : urlHost as string,
                };
                
                if(this.requestCookie && this.requestCookie.trim().length > 0) {
                    headers['Cookie'] = this.requestCookie;
                }

                request({
                    method : this.requestMethod,
                    uri : this.requestUrl,
                    headers :  headers,
                    jar : typeof headers['Cookie'] == "undefined" ? true : false,
                    strictSSL : false,
                }, (error, response, body): void => {
                    this.momentPing = moment();
                    this.momentDone = moment();
                    this.requestCompleted = true;
                    this.momentDuration = moment.duration(this.momentInitiated.diff(this.momentDone));
                    this.requestErrors.push(error);
                    this.pageData = body;
                    resolve(this);
                });
            }
        });
    }
}
