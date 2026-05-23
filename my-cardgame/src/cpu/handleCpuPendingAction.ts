import { cpuResolveProphet } from "./cpuProphet";
import { cpuResolveThief } from "./cpuThief";
import { cpuResolveMerchant } from "./cpuMerchant";
import { cpuResolveFortune } from "./cpuFortune";
import { cpuResolveAngel } from "./cpuAngel";
import { cpuResolveMagician } from "./cpuMagician";
import { cpuResolveSeizure } from "./cpuSeizure";
import { resolveConfusionHandler } from "../effects/confusionHandler";
// 他のカードもここに import していく

export function handleCpuPendingAction(args: any) {
    const { pendingAction } = args;

    switch (pendingAction.kind) {
        case "seizure":
            return cpuResolveSeizure(args);
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
        case "confusion":
            resolveConfusionHandler(args);
            return;
        // 他のカードもここに追加
    }
}