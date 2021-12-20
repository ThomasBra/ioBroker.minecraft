declare module "minecraft-status";

declare global {
    namespace minecraftStatus {
        class MinecraftServerListPing {

            static ping(protocol: number, host: string, port: number, timeout: number): Promise<any>

            static ping16(protocol: number, host: string, port: number, timeout: number): Promise<any>

            static ping15(host: string, port: number, timeout: number): Promise<any>

            static ping13(host: string, port: number, timeout: number): Promise<any>

        }
    }
}