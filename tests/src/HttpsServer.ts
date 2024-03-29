import http, {IncomingMessage, ServerResponse} from "node:http";
import https, {Server as BaseServer} from "node:https";
import {createHttpTerminator, HttpTerminator} from "http-terminator";

type Options = {
    baseUrl: URL,
    tlsCert: Buffer,
    tlsKey: Buffer,
};

export class HttpsServer {
    private readonly server: BaseServer<typeof http.IncomingMessage, typeof http.ServerResponse>;
    private readonly terminator: HttpTerminator;

    constructor(private readonly options: Options) {
        this.server = https.createServer({
            key: options.tlsKey,
            cert: options.tlsCert,
        });
        this.terminator = createHttpTerminator({server: this.server});
    }

    async once(): Promise<IncomingMessage> {
        return new Promise((resolve, reject) => {
            this.server.once("error", error => reject(error));
            this.server.once("request", (request, response) => {
                response.end();
                resolve(request);
            });
        });
    }

    start() {
        // @ts-ignore
        this.server.listen(this.options.baseUrl.port, this.options.baseUrl.hostname, () => {
            console.info(`Server listening at ${this.options.baseUrl.toString()}`);
        });
    }

    async stop() {
        this.server.removeAllListeners();
        void this.terminator.terminate();
    }
}
