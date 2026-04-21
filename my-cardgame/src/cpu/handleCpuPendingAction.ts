import { cpuResolveProphet } from "./cpuProphet";
import { cpuResolveThief } from "./cpuThief";
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
        // 他のカードもここに追加
    }
}