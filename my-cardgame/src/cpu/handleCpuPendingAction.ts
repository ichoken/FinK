import { cpuResolveProphet } from "./cpuProphet";
import { cpuResolveThief } from "./cpuThief";
import { cpuResolveMerchant } from "./cpuMerchant";
import { cpuResolveFortune } from "./cpuFortune";
import { cpuResolveAngel } from "./cpuAngel";
import { cpuResolveMagician } from "./cpuMagician";
// 他のカードもここに import していく

export function handleCpuPendingAction(args: any) {
    const { pendingAction } = args;

    switch (pendingAction.kind) {
        case "prophet":
            return cpuResolveProphet(args);
        case "thief":
            return cpuResolveThief(args);
        case "merchant":
            return cpuResolveMerchant(args);
        case "fortune":
            return cpuResolveFortune(args);
        case "angel":
            return cpuResolveAngel(args);
        case "magician":
            return cpuResolveMagician(args);
        // 他のカードもここに追加
    }
}