/*
 * Created with @iobroker/create-adapter v2.0.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import * as mcs from "minecraft-status";
//const MinecraftServerListPing = require("minecraft-status");

// Load your modules here, e.g.:
// import * as fs from "fs";

class minecraft extends utils.Adapter {
	server = "";
	port = 25565;
	timer: ioBroker.Interval = this.setInterval(this.syncState, 60000);

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: "minecraft",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}


	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		this.log.info("config host: " + this.config.host);

		const hostSplit: string[] = this.config.host?.split(":");

		if (hostSplit) {
			this.server = hostSplit[0];
			if (hostSplit.length > 1) {
				this.port = Number.parseInt(hostSplit[1]);
			}
		}

		/*await this.setObjectNotExistsAsync("testVariable", {
			type: "state",
			common: {
				name: "testVariable",
				type: "boolean",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});*/

		//this.subscribeStates("testVariable");

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		//await this.setStateAsync("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		//await this.setStateAsync("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		//await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		//let result = await this.checkPasswordAsync("admin", "iobroker");
		//this.log.info("check user admin pw iobroker: " + result);

		//result = await this.checkGroupAsync("admin", "admin");
		//this.log.info("check group user admin group admin: " + result);
	}

	private syncState(): string {
		if (this.server && this.port) {
			const call: Promise<any> = mcs.MinecraftServerListPing.ping(4, this.server, this.port, 3000);
			call.then(response => {
				this.log.debug(JSON.stringify(response));

				this.setStateAsync("description.text", { val: response.description.text, ack: true });
				const extras: any[] = response.description.extra;
				this.setStateAsync("description.extra", { val: extras.map(extra => extra.text).join(" "), ack: true });
				this.setStateAsync("players.max", { val: response.players.max, ack: true });
				this.setStateAsync("players.online", { val: response.players.online, ack: true });
				const samples: any[] = response.players.sample;
				this.setStateAsync("players.names", { val: samples.map(sample => sample.name).join(","), ack: true });
				this.setStateAsync("version.name", { val: response.version.name, ack: true });
				this.setStateAsync("version.protocol", { val: response.version.protocol, ack: true });
			}).catch(err => {
				this.log.error(err);
			});
		}
		return "runing";
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
		try {
			// clearTimeout(timeout1);
			clearInterval(this.timer);

			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed state changes
	 */
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new minecraft(options);
} else {
	// otherwise start the instance directly
	(() => new minecraft())();
}