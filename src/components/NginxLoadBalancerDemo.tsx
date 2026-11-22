import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Activity, Network, Plus, Send, Server, Zap } from 'lucide-react';
import FloodButton from './motion/FloodButton';
import TextScramble from './motion/TextScramble';
import { LoadBalancerDemoConfig } from '../types';

interface Pod {
  id: string;
  name: string;
  internalIp: string;
  node: string;
}

interface DispatchLog {
  id: string;
  timestamp: string;
  clientTab: string;
  podName: string;
  internalIp: string;
  policyNote: string;
}

const DEFAULT_PODS: Pod[] = [
  {
    id: 'w1',
    name: 'nginx-ha-prod-7d4f9b-w1',
    internalIp: '10.42.1.24',
    node: 'worker-01',
  },
  {
    id: 'w2',
    name: 'nginx-ha-prod-8f2c1a-w2',
    internalIp: '10.42.2.18',
    node: 'worker-02',
  },
  {
    id: 'w3',
    name: 'nginx-ha-prod-9a5e3d-w3',
    internalIp: '10.42.1.31',
    node: 'worker-03',
  },
];

interface NginxLoadBalancerDemoProps {
  config?: LoadBalancerDemoConfig;
}

export const NginxLoadBalancerDemo: React.FC<NginxLoadBalancerDemoProps> = ({ config }) => {
  const pods = useMemo(
    () => (config?.pods && config.pods.length > 0 ? config.pods : DEFAULT_PODS),
    [config]
  );

  const eyebrow = config?.eyebrow || 'Interactive Simulator · K8s + MetalLB + Ingress';
  const title = config?.title || 'HA NGINX Load Balancer Request Routing';
  const description =
    config?.description ||
    'Demonstrates how client sessions and separate browser tabs hit a cluster virtual IP and rotate across replica pods with distinct internal pod names and IPs.';
  const vipAddress = config?.vipAddress || '192.168.1.180';
  const protocol = config?.protocol || 'HTTP/2 TLS';
  const controller = config?.controller || 'Ingress Proxy';
  const endpointPath = config?.endpointPath || '/api/whoami';

  const [activePodIndex, setActivePodIndex] = useState<number>(0);
  const [clientTab, setClientTab] = useState<string>('browser-tab-alpha');
  const [tabCounter, setTabCounter] = useState<number>(1);
  const [pulseSeq, setPulseSeq] = useState<number>(0);
  const [podRequestCounts, setPodRequestCounts] = useState<{ [key: string]: number }>({
    [pods[0]?.id || 'w1']: 18,
    [pods[1]?.id || 'w2']: 19,
    [pods[2]?.id || 'w3']: 17,
  });
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([
    {
      id: 'log-3',
      timestamp: '16:04:12',
      clientTab: 'browser-tab-alpha',
      podName: pods[2]?.name || pods[0].name,
      internalIp: pods[2]?.internalIp || pods[0].internalIp,
      policyNote: 'Round-Robin Hop',
    },
    {
      id: 'log-2',
      timestamp: '16:03:58',
      clientTab: 'browser-tab-beta',
      podName: pods[1]?.name || pods[0].name,
      internalIp: pods[1]?.internalIp || pods[0].internalIp,
      policyNote: 'New Tab Session',
    },
    {
      id: 'log-1',
      timestamp: '16:03:40',
      clientTab: 'browser-tab-alpha',
      podName: pods[0].name,
      internalIp: pods[0].internalIp,
      policyNote: 'Round-Robin Hop',
    },
  ]);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const prefersReduced = useReducedMotion();

  const activePod = pods[activePodIndex] || pods[0];
  const totalRequests = Object.values(podRequestCounts).reduce((a, b) => a + b, 0);

  const dispatchRequest = (specificTab?: string, reason = 'Round-Robin Hop') => {
    setIsDispatching(true);
    setPulseSeq((s) => s + 1);
    const targetTab = specificTab || clientTab;
    const nextIndex = (activePodIndex + 1) % pods.length;
    const targetPod = pods[nextIndex];
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    setTimeout(() => {
      setActivePodIndex(nextIndex);
      setPodRequestCounts((prev) => ({
        ...prev,
        [targetPod.id]: (prev[targetPod.id] || 0) + 1,
      }));
      setDispatchLogs((prev) => [
        {
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: timeStr,
          clientTab: targetTab,
          podName: targetPod.name,
          internalIp: targetPod.internalIp,
          policyNote: reason,
        },
        ...prev.slice(0, 7),
      ]);
      setIsDispatching(false);
    }, 180);
  };

  const handleSimulateNewTab = () => {
    const nextTabNum = tabCounter + 1;
    const tabNames = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'zeta'];
    const chosenName = tabNames[nextTabNum % tabNames.length];
    const newTab = `browser-tab-${chosenName}`;
    setTabCounter(nextTabNum);
    setClientTab(newTab);
    dispatchRequest(newTab, 'New Tab Session');
  };

  const handleBurstTraffic = () => {
    setIsDispatching(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      dispatchRequest(undefined, `Burst ${count}/3`);
      if (count >= 3) {
        clearInterval(interval);
      }
    }, 195);
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 sm:p-8 border-b border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1.5">
            <Network className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{eyebrow}</span>
          </div>
          <h3 className="font-display font-bold text-xl text-zinc-50">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-200 whitespace-nowrap shrink-0">
          <Server className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
          <span>{pods.length} / {pods.length} Replicas Configured</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="px-4 sm:px-6 py-4 bg-white/[0.02] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-400">Active Session:</span>
          <span className="text-amber-300 font-semibold">{clientTab}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <FloodButton
            onClick={() => dispatchRequest()}
            disabled={isDispatching}
            variant="primary"
            className="flex-1 sm:flex-none justify-center px-3.5 py-2 min-h-[42px] sm:min-h-[38px] font-mono text-xs"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Send Request</span>
          </FloodButton>

          <FloodButton
            onClick={handleSimulateNewTab}
            disabled={isDispatching}
            variant="glass"
            className="flex-1 sm:flex-none justify-center px-3.5 py-2 min-h-[42px] sm:min-h-[38px] font-mono text-xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>New Tab</span>
          </FloodButton>

          <FloodButton
            onClick={handleBurstTraffic}
            disabled={isDispatching}
            variant="ghost"
            className="px-3.5 py-2 min-h-[42px] sm:min-h-[38px] font-mono text-xs"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            <span>Burst 3x</span>
          </FloodButton>
        </div>
      </div>

      {/* Animated Conduit Transit Bus */}
      <div className="px-4 sm:px-6 py-3 bg-[#040d08]/75 border-b border-white/[0.08] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 text-[11px] font-mono text-zinc-400">
        <span className="whitespace-nowrap text-zinc-300">VIP {vipAddress}</span>
        <div className="relative flex-1 min-w-[60px] h-4 flex items-center">
          <div className="w-full h-[1px] connector-dash-active" />
          {!prefersReduced && pulseSeq > 0 && (
            <motion.div
              key={pulseSeq}
              initial={{ left: '0%', opacity: 1 }}
              animate={{ left: '100%', opacity: [1, 1, 0] }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-yellow-200 shadow-[0_0_12px_4px_rgba(250,204,21,0.85)] pointer-events-none"
            />
          )}
        </div>
        <span className="whitespace-nowrap text-emerald-400 font-semibold tabular-nums">
          {activePod.node} · {activePod.internalIp}
        </span>
      </div>

      {/* 3-Column Topology Readout */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] border-b border-white/[0.08]">
        {/* Column 1: Ingress VIP */}
        <div className="p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-zinc-400 mb-1">01 · Ingress VIP</div>
            <div className="font-display text-sm font-bold text-zinc-100 mb-4">
              {controller}
            </div>
            <dl className="space-y-2 text-xs font-mono">
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400">VIP Address</dt>
                <dd className="text-zinc-100 tabular-nums">{vipAddress}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400">Protocol</dt>
                <dd className="text-zinc-100">{protocol}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400">Controller</dt>
                <dd className="text-zinc-100">{controller}</dd>
              </div>
            </dl>
          </div>
          <div className="mt-5 pt-3 border-t border-white/[0.07] text-xs font-mono text-zinc-400">
            Endpoint: <span className="text-zinc-200">{endpointPath}</span>
          </div>
        </div>

        {/* Column 2: Active Serving Pod */}
        <div className="p-6 flex flex-col justify-between bg-emerald-500/[0.05]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 mb-1">
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              <span>02 · Active Target Pod</span>
            </div>
            <div className="font-mono text-sm font-bold text-zinc-50 truncate mb-4">
              <TextScramble text={activePod.name} trigger="change" durationMs={260} />
            </div>
            <dl className="space-y-2 text-xs font-mono">
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400">Internal Pod IP</dt>
                <dd className="text-amber-300 font-bold tabular-nums">
                  <TextScramble text={activePod.internalIp} trigger="change" durationMs={260} />
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400">Worker Node</dt>
                <dd className="text-zinc-100">{activePod.node}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400">HTTP Status</dt>
                <dd className="text-zinc-100">200 OK</dd>
              </div>
            </dl>
          </div>
          <div className="mt-5 pt-3 border-t border-white/[0.07] flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Round-Robin Policy</span>
            <span className="text-zinc-200">L2 VIP Forward</span>
          </div>
        </div>

        {/* Column 3: Load Balance Share */}
        <div className="p-6">
          <div className="text-xs font-mono text-zinc-400 mb-1">
            03 · Share ({totalRequests} simulated requests)
          </div>
          <div className="font-display text-sm font-bold text-zinc-100 mb-4">
            Replica Distribution
          </div>
          <div className="space-y-3">
            {pods.map((pod, idx) => {
              const count = podRequestCounts[pod.id] || 0;
              const pct = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 33;
              const isActive = activePodIndex === idx;

              return (
                <div key={pod.id} className="text-xs font-mono">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={isActive ? 'text-amber-300 font-semibold' : 'text-zinc-400'}>
                      {pod.id.toUpperCase()} · <span className="tabular-nums">{pod.internalIp}</span>
                    </span>
                    <span className="text-zinc-300 tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${pct}%` }}
                      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                      className={`h-full rounded-full ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500 via-yellow-400 to-orange-500'
                          : 'bg-zinc-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dispatch Trace Log */}
      <div>
        <div className="px-6 py-3 bg-white/[0.02] border-b border-white/[0.08] flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>Simulated Ingress Request Log</span>
          <span className="hidden sm:inline">Click Send Request or New Tab Session above</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-zinc-400 border-b border-white/[0.08]">
                <th className="py-2.5 px-6 font-normal">Time</th>
                <th className="py-2.5 px-4 font-normal">Client Session</th>
                <th className="py-2.5 px-4 font-normal">Pod Hostname</th>
                <th className="py-2.5 px-4 font-normal">Pod IP</th>
                <th className="py-2.5 px-4 font-normal">Routing Action</th>
                <th className="py-2.5 px-6 font-normal text-right">Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              <AnimatePresence initial={false}>
                {dispatchLogs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-2.5 px-6 text-zinc-400 tabular-nums">{log.timestamp}</td>
                    <td className="py-2.5 px-4 text-emerald-400">{log.clientTab}</td>
                    <td className="py-2.5 px-4 text-zinc-100">{log.podName}</td>
                    <td className="py-2.5 px-4 text-zinc-50 font-semibold tabular-nums">
                      {log.internalIp}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-300">{log.policyNote}</td>
                    <td className="py-2.5 px-6 text-right text-zinc-200 tabular-nums">200 OK</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NginxLoadBalancerDemo;
