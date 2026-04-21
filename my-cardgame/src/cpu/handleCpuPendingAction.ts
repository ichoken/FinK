import { cpuResolveProphet } from "./cpuProphet";
import { cpuResolveThief } from "./cpuThief";
import { cpuResolveMerchant } from "./cpuMerchant";
import { cpuResolveFortune } from "./cpuFortune";
import { cpuResolveAngel } from "./cpuAngel";
import { cpuResolveMagician } from "./cpuMagician";
// 他のカードもここに import していく

export function handleCpuPendingAction(args) {
    const { pendingAction } = args;

    switch (pendingAction.kind) {
        case "prophet":
            cpuResolveProphet(args);
            break;
        case "thief":
            cpuResolveThief(args);
            break;
        case "merchant":
            cpuResolveMerchant(args);
            break;
        case "fortune":
            cpuResolveFortune(args);
            break;
        case "angel":
            cpuResolveAngel(args);
            break;
        case "magician":
            cpuResolveMagician(args);
            break;
        // 他のカードもここに追加
    }
}