"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Created with @iobroker/create-adapter v2.0.1
 */
const utils = __importStar(require("@iobroker/adapter-core"));
const mcs = __importStar(require("minecraft-status"));
let timer;
class minecraft extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: "minecraft",
        });
        this.server = "";
        this.port = 25565;
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        this.on("unload", this.onUnload.bind(this));
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        var _a;
        this.log.info("config host: " + this.config.host);
        const hostSplit = (_a = this.config.host) === null || _a === void 0 ? void 0 : _a.split(":");
        this.log.info(JSON.stringify(hostSplit));
        if (hostSplit) {
            this.server = hostSplit[0];
            if (hostSplit.length > 1) {
                this.port = Number.parseInt(hostSplit[1]);
            }
            this.log.info("config server: " + this.server + " port: " + this.port);
        }
        timer = this.setInterval(() => this.syncState(), 30000);
        this.syncState();
    }
    syncState() {
        this.setStateAsync("info.server", { val: this.server, ack: true });
        this.setStateAsync("info.port", { val: this.port, ack: true });
        if (this.server && this.port) {
            const call = mcs.MinecraftServerListPing.ping(4, this.server, this.port, 3000);
            call.then(response => {
                var _a, _b, _c, _d, _e, _f, _g;
                this.log.debug(JSON.stringify(response));
                this.setStateAsync("description.text", { val: (_a = response.description) === null || _a === void 0 ? void 0 : _a.text, ack: true });
                const extras = (_b = response.description) === null || _b === void 0 ? void 0 : _b.extra;
                this.setStateAsync("description.extra", { val: extras === null || extras === void 0 ? void 0 : extras.map(extra => extra.text).join(" "), ack: true });
                this.setStateAsync("players.max", { val: (_c = response.players) === null || _c === void 0 ? void 0 : _c.max, ack: true });
                this.setStateAsync("players.online", { val: (_d = response.players) === null || _d === void 0 ? void 0 : _d.online, ack: true });
                const samples = (_e = response.players) === null || _e === void 0 ? void 0 : _e.sample;
                const namesArray = samples === null || samples === void 0 ? void 0 : samples.map(sample => sample.name);
                if (namesArray.length > 0) {
                    namesArray.forEach(name => {
                        const id = "players." + name.toString();
                        this.getObject(id, (err, obj) => {
                            if (err)
                                this.log.error(err.message);
                            if (!obj) {
                                this.setObjectNotExists(id, {
                                    "type": "state",
                                    "common": {
                                        "name": name + " is online",
                                        "role": "state",
                                        "type": "boolean",
                                        "read": true,
                                        "write": false
                                    },
                                    native: {}
                                });
                            }
                        });
                    });
                }
                this.getState("players.names", (err, state) => {
                    const value = state === null || state === void 0 ? void 0 : state.val;
                    if (value) {
                        const oldNamesArray = JSON.parse(value);
                        oldNamesArray.filter(oldName => !namesArray.includes(oldName)).forEach(oldName => this.setStateAsync("players." + oldName, { val: false, ack: true }));
                        namesArray.filter(name => !oldNamesArray.includes(name)).forEach(name => this.setStateAsync("players." + name, { val: true, ack: true }));
                    }
                    let names = JSON.stringify(namesArray);
                    if (!names)
                        names = "[]";
                    this.setStateAsync("players.names", { val: names, ack: true });
                });
                this.setStateAsync("version.name", { val: (_f = response.version) === null || _f === void 0 ? void 0 : _f.name, ack: true });
                this.setStateAsync("version.protocol", { val: (_g = response.version) === null || _g === void 0 ? void 0 : _g.protocol, ack: true });
                this.setStateAsync("info.online", { val: true, ack: true });
            }).catch(err => {
                this.setStateAsync("info.online", { val: false, ack: true });
                this.log.debug(err);
            });
        }
        return "runing";
    }
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    onUnload(callback) {
        try {
            // clearTimeout(timeout1);
            this.log.info("unload minecraft adapter");
            this.clearInterval(timer);
            callback();
        }
        catch (e) {
            callback();
        }
    }
    /**
     * Is called if a subscribed state changes
     */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        }
        else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }
}
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options) => new minecraft(options);
}
else {
    // otherwise start the instance directly
    (() => new minecraft())();
}
//# sourceMappingURL=main.js.map