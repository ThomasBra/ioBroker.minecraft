/*
 * Created with @iobroker/create-adapter v2.0.1
 */
import * as utils from "@iobroker/adapter-core";
import * as mcs from "minecraft-status";

let timer: ioBroker.Interval;
class minecraft extends utils.Adapter {
	server = "";
	port = 25565;

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: "minecraft",
		});

		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}


	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		this.log.info("config host: " + this.config.host);

		const hostSplit: string[] = this.config.host?.split(":");
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

	private syncState(): string {
		this.setStateAsync("info.server", { val: this.server, ack: true });
		this.setStateAsync("info.port", { val: this.port, ack: true });
		if (this.server && this.port) {
			const call: Promise<any> = mcs.MinecraftServerListPing.ping(4, this.server, this.port, 3000);
			call.then(response => {
				this.log.debug(JSON.stringify(response));

				this.setStateAsync("description.text", { val: response.description?.text, ack: true });
				const extras: any[] = response.description?.extra;
				this.setStateAsync("description.extra", { val: extras?.map(extra => extra.text).join(" "), ack: true });
				this.setStateAsync("players.max", { val: response.players?.max, ack: true });
				this.setStateAsync("players.online", { val: response.players?.online, ack: true });
				const samples: any[] = response.players?.sample;
				const namesArray = samples?.map(sample => sample.name);
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
					const value: any = state?.val;
					if (value) {
						const oldNamesArray: [string] = JSON.parse(value);

						oldNamesArray.filter(oldName => !namesArray.includes(oldName)).forEach(oldName => this.setStateAsync("players." + oldName, { val: false, ack: true }));
						namesArray.filter(name => !oldNamesArray.includes(name)).forEach(name => this.setStateAsync("players." + name, { val: true, ack: true }));
					}

					let names = JSON.stringify(namesArray);
					if (!names)
						names = "[]";
					this.setStateAsync("players.names", { val: names, ack: true });
				});
				this.setStateAsync("version.name", { val: response.version?.name, ack: true });
				this.setStateAsync("version.protocol", { val: response.version?.protocol, ack: true });
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
	private onUnload(callback: () => void): void {
		try {
			// clearTimeout(timeout1);
			this.log.info("unload minecraft adapter");
			this.clearInterval(timer);

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