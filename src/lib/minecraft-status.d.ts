declare module "minecraft-status" {

    class MinecraftServerListPing {

        static ping(protocol: number, host: string, port: number, timeout: number): Promise<any>

        static ping16(protocol: number, host: string, port: number, timeout: number): Promise<any>

        static ping15(host: string, port: number, timeout: number): Promise<any>

        static ping13(host: string, port: number, timeout: number): Promise<any>

    }

    class MinecraftQuery {

        static query(host: string, port = 25565, callback, timeout = 3000): Promise<any>

        static fullQuery(host: string, port = 25565, callback, timeout = 3000): Promise<any>
    }
}