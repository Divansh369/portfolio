import React from 'react';
import { Cpu, Database, Layers, Server } from 'lucide-react';
import { SkillIconTile } from '../../types';

export type TechCategoryId = 'infra' | 'languages' | 'data' | 'apps';

export interface NormalizedTileNode {
  id: string;
  index: number;
  tile: SkillIconTile;
  category: TechCategoryId;
}

export interface GraphEdge {
  key: string;
  fromIndex: number;
  toIndex: number;
  fromId: string;
  toId: string;
}

export type MatrixRelationKind = 'self' | 'direct' | 'bridge' | 'layer' | 'none';

export interface HeatmapCellData {
  rowId: string;
  colId: string;
  rowIndex: number;
  colIndex: number;
  kind: MatrixRelationKind;
  /** 0 = unrelated, 1 = same layer, 2 = 1 shared bridge, 3 = 2+ shared bridges, 4 = direct edge, 5 = self hub */
  score: number;
  degree: number;
  sharedBridges: string[];
}

export const GRAPH_WIDTH = 1000;
export const GRAPH_HEIGHT = 640;

export const LANE_ORDER: TechCategoryId[] = ['infra', 'languages', 'data', 'apps'];

export const LANE_META: Record<
  TechCategoryId,
  {
    label: string;
    shortLabel: string;
    accentHex: string;
    icon: React.FC<{ className?: string }>;
  }
> = {
  infra: {
    label: 'Infrastructure & Linux',
    shortLabel: 'Infra & Linux',
    accentHex: '#10b981',
    icon: Server,
  },
  languages: {
    label: 'Languages & Compute',
    shortLabel: 'Languages',
    accentHex: '#34d399',
    icon: Cpu,
  },
  data: {
    label: 'Data & ML Pipelines',
    shortLabel: 'Data & ML',
    accentHex: '#facc15',
    icon: Database,
  },
  apps: {
    label: 'Apps, APIs & Analytics',
    shortLabel: 'Apps & APIs',
    accentHex: '#fb923c',
    icon: Layers,
  },
};

export const normalizeToken = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();

export const inferCategory = (tile: SkillIconTile): TechCategoryId => {
  if (tile.category && LANE_ORDER.includes(tile.category)) {
    return tile.category;
  }
  const key = normalizeToken(`${tile.brandKey} ${tile.label}`);
  if (
    key.includes('linux') ||
    key.includes('bash') ||
    key.includes('shell') ||
    key.includes('proxmox') ||
    key.includes('docker') ||
    key.includes('kube') ||
    key.includes('k3s') ||
    key.includes('traefik') ||
    key.includes('nginx') ||
    key.includes('raspberry') ||
    key.includes('git') ||
    key.includes('aws') ||
    key.includes('tailscale') ||
    key.includes('cloudflare') ||
    key.includes('metallb') ||
    key.includes('talos') ||
    key.includes('rancher') ||
    key.includes('casaos') ||
    key.includes('coolify') ||
    key.includes('easypanel') ||
    key.includes('homeassistant')
  ) {
    return 'infra';
  }
  if (
    key.includes('spark') ||
    key.includes('apache') ||
    key.includes('databricks') ||
    key.includes('postgres') ||
    key.includes('sql') ||
    key.includes('pandas') ||
    key.includes('numpy') ||
    key.includes('scikit') ||
    key.includes('tensorflow') ||
    key.includes('pytorch') ||
    key.includes('redis') ||
    key.includes('minio') ||
    key.includes('prophet') ||
    key.includes('superset')
  ) {
    return 'data';
  }
  if (
    key.includes('fastapi') ||
    key.includes('node') ||
    key.includes('react') ||
    key.includes('flutter') ||
    key.includes('nocodb') ||
    key.includes('powerbi') ||
    key.includes('office') ||
    key.includes('godot') ||
    key.includes('gotify')
  ) {
    return 'apps';
  }
  return 'languages';
};

export const normalizeTiles = (tiles: SkillIconTile[]): NormalizedTileNode[] => {
  const usedIds = new Set<string>();
  return tiles.map((tile, idx) => {
    const base = normalizeToken(tile.label || tile.brandKey) || `tool-${idx}`;
    const id = usedIds.has(base) ? `${base}-${idx}` : base;
    usedIds.add(id);
    return {
      id,
      index: idx,
      tile,
      category: inferCategory(tile),
    };
  });
};

export const buildEdgesFromNodes = (nodes: NormalizedTileNode[]): GraphEdge[] => {
  if (nodes.length < 2) return [];

  const lookup = new Map<string, number>();
  nodes.forEach((node, idx) => {
    lookup.set(node.id, idx);
    lookup.set(normalizeToken(node.tile.label), idx);
    const bk = normalizeToken(node.tile.brandKey);
    if (bk && !lookup.has(bk)) {
      lookup.set(bk, idx);
    }
  });

  const seen = new Set<string>();
  const list: GraphEdge[] = [];

  nodes.forEach((node, fromIdx) => {
    const conns = node.tile.connections || [];
    conns.forEach((rawTarget) => {
      const toIdx = lookup.get(normalizeToken(rawTarget));
      if (toIdx === undefined || toIdx === fromIdx) return;
      const lo = Math.min(fromIdx, toIdx);
      const hi = Math.max(fromIdx, toIdx);
      const edgeKey = `${lo}-${hi}`;
      if (!seen.has(edgeKey)) {
        seen.add(edgeKey);
        list.push({
          key: edgeKey,
          fromIndex: lo,
          toIndex: hi,
          fromId: nodes[lo].id,
          toId: nodes[hi].id,
        });
      }
    });
  });

  // Graceful fallback for cloned configs that omit `connections`
  if (list.length === 0) {
    for (let i = 0; i < nodes.length - 1; i++) {
      list.push({
        key: `seq-${i}-${i + 1}`,
        fromIndex: i,
        toIndex: i + 1,
        fromId: nodes[i].id,
        toId: nodes[i + 1].id,
      });
    }
  }

  return list;
};

export const buildNeighborMap = (
  nodes: NormalizedTileNode[],
  edges: GraphEdge[]
): Map<string, Set<string>> => {
  const map = new Map<string, Set<string>>();
  nodes.forEach((n) => map.set(n.id, new Set()));
  edges.forEach((edge) => {
    map.get(edge.fromId)?.add(edge.toId);
    map.get(edge.toId)?.add(edge.fromId);
  });
  return map;
};

export const computeRelationshipMatrix = (
  orderedNodes: NormalizedTileNode[],
  neighborMap: Map<string, Set<string>>
): {
  cells: HeatmapCellData[];
  nodeById: Map<string, NormalizedTileNode>;
} => {
  const nodeById = new Map<string, NormalizedTileNode>();
  orderedNodes.forEach((n) => nodeById.set(n.id, n));

  const cells: HeatmapCellData[] = [];

  for (let r = 0; r < orderedNodes.length; r++) {
    const rowNode = orderedNodes[r];
    const rowNeighbors = neighborMap.get(rowNode.id) ?? new Set<string>();

    for (let c = 0; c < orderedNodes.length; c++) {
      const colNode = orderedNodes[c];

      if (r === c) {
        cells.push({
          rowId: rowNode.id,
          colId: colNode.id,
          rowIndex: r,
          colIndex: c,
          kind: 'self',
          score: 5,
          degree: rowNeighbors.size,
          sharedBridges: [],
        });
        continue;
      }

      if (rowNeighbors.has(colNode.id)) {
        cells.push({
          rowId: rowNode.id,
          colId: colNode.id,
          rowIndex: r,
          colIndex: c,
          kind: 'direct',
          score: 4,
          degree: 0,
          sharedBridges: [],
        });
        continue;
      }

      const colNeighbors = neighborMap.get(colNode.id) ?? new Set<string>();
      const sharedBridges: string[] = [];
      rowNeighbors.forEach((neighborId) => {
        if (colNeighbors.has(neighborId)) {
          const bridgeNode = nodeById.get(neighborId);
          if (bridgeNode) {
            sharedBridges.push(bridgeNode.tile.label);
          }
        }
      });

      if (sharedBridges.length >= 2) {
        cells.push({
          rowId: rowNode.id,
          colId: colNode.id,
          rowIndex: r,
          colIndex: c,
          kind: 'bridge',
          score: 3,
          degree: 0,
          sharedBridges,
        });
      } else if (sharedBridges.length === 1) {
        cells.push({
          rowId: rowNode.id,
          colId: colNode.id,
          rowIndex: r,
          colIndex: c,
          kind: 'bridge',
          score: 2,
          degree: 0,
          sharedBridges,
        });
      } else if (rowNode.category === colNode.category) {
        cells.push({
          rowId: rowNode.id,
          colId: colNode.id,
          rowIndex: r,
          colIndex: c,
          kind: 'layer',
          score: 1,
          degree: 0,
          sharedBridges: [],
        });
      } else {
        cells.push({
          rowId: rowNode.id,
          colId: colNode.id,
          rowIndex: r,
          colIndex: c,
          kind: 'none',
          score: 0,
          degree: 0,
          sharedBridges: [],
        });
      }
    }
  }

  return { cells, nodeById };
};

const EXTRA_TOOL_META: Record<
  string,
  Pick<SkillIconTile, 'summary' | 'websiteUrl' | 'githubUrl' | 'isFoss' | 'category'>
> = {
  go: {
    summary: 'Statically typed systems and concurrency language powering CLI tooling, networking services, and engines.',
    websiteUrl: 'https://go.dev/',
    githubUrl: 'https://github.com/golang/go',
    isFoss: true,
    category: 'languages',
  },
  deltalake: {
    summary: 'Open-source ACID storage layer bringing reliability, time travel, and versioning to Apache Spark lakehouses.',
    websiteUrl: 'https://delta.io/',
    githubUrl: 'https://github.com/delta-io/delta',
    isFoss: true,
    category: 'data',
  },
  kobotoolbox: {
    summary: 'Open-source field data collection platform for structured civic and humanitarian surveys.',
    websiteUrl: 'https://www.kobotoolbox.org/',
    githubUrl: 'https://github.com/kobotoolbox/kpi',
    isFoss: true,
    category: 'data',
  },
  redis: {
    summary: 'In-memory key-value data store caching API responses and real-time pub/sub state.',
    websiteUrl: 'https://redis.io/',
    githubUrl: 'https://github.com/redis/redis',
    isFoss: true,
    category: 'data',
  },
  minio: {
    summary: 'High-performance, S3-compatible open-source object storage for media assets and datasets.',
    websiteUrl: 'https://min.io/',
    githubUrl: 'https://github.com/minio/minio',
    isFoss: true,
    category: 'data',
  },
  aws: {
    summary: 'Cloud compute, storage, and managed infrastructure services supporting scalable deployments.',
    websiteUrl: 'https://aws.amazon.com/',
    isFoss: false,
    category: 'infra',
  },
  superset: {
    summary: 'Open-source enterprise business intelligence and SQL exploration web platform.',
    websiteUrl: 'https://superset.apache.org/',
    githubUrl: 'https://github.com/apache/superset',
    isFoss: true,
    category: 'apps',
  },
};

export const resolveSkillTileMeta = (
  skillLabel: string,
  tiles: SkillIconTile[]
): SkillIconTile => {
  const target = normalizeToken(skillLabel);

  // 1. Exact label or brandKey match against configured tiles
  const exact = tiles.find(
    (t) => normalizeToken(t.label) === target || normalizeToken(t.brandKey) === target
  );
  if (exact) return exact;

  // 2. Token match across compound strings like "Docker & Docker Compose" or "SQL & PostgreSQL"
  const parts = skillLabel
    .split(/[&·/,()+]+/)
    .map((part) => normalizeToken(part))
    .filter((p) => p.length >= 2);

  for (const part of parts) {
    const matched = tiles.find((t) => {
      const lbl = normalizeToken(t.label);
      const bk = normalizeToken(t.brandKey);
      return lbl === part || bk === part || (part.length >= 3 && (lbl.includes(part) || part.includes(lbl)));
    });
    if (matched) {
      return {
        ...matched,
        label: skillLabel,
      };
    }
  }

  // 3. Secondary match in optional fallback metadata dictionary
  for (const part of [target, ...parts]) {
    const extraKey = Object.keys(EXTRA_TOOL_META).find(
      (k) => part === k || (part.length >= 3 && part.includes(k))
    );
    if (extraKey) {
      const meta = EXTRA_TOOL_META[extraKey];
      return {
        label: skillLabel,
        brandKey: extraKey,
        category: meta.category,
        summary: meta.summary,
        websiteUrl: meta.websiteUrl,
        githubUrl: meta.githubUrl,
        isFoss: meta.isFoss,
      };
    }
  }

  return {
    label: skillLabel,
    brandKey: skillLabel,
    category: inferCategory({ label: skillLabel, brandKey: skillLabel }),
    summary: `Core capability applied across production engineering workflows and system builds.`,
  };
};

export interface ResolvedSkillProficiency {
  proficiency: number;
  years: string;
  levelLabel: string;
}

const DEFAULT_PROFICIENCY_BY_TOKEN: Record<string, ResolvedSkillProficiency> = {
  python: { proficiency: 95, years: '4+ yrs', levelLabel: 'Core Daily' },
  linux: { proficiency: 92, years: '4+ yrs', levelLabel: 'Core Daily' },
  git: { proficiency: 92, years: '4+ yrs', levelLabel: 'Core Daily' },
  sqlpostgresql: { proficiency: 90, years: '3+ yrs', levelLabel: 'Production' },
  postgresql: { proficiency: 90, years: '3+ yrs', levelLabel: 'Production' },
  sqlpostgres: { proficiency: 90, years: '3+ yrs', levelLabel: 'Production' },
  databricks: { proficiency: 90, years: '2+ yrs', levelLabel: 'Production' },
  apachespark: { proficiency: 88, years: '2+ yrs', levelLabel: 'Production' },
  apache: { proficiency: 88, years: '2+ yrs', levelLabel: 'Production' },
  docker: { proficiency: 90, years: '3+ yrs', levelLabel: 'Core Daily' },
  proxmoxve: { proficiency: 88, years: '2+ yrs', levelLabel: 'Production' },
  proxmox: { proficiency: 88, years: '2+ yrs', levelLabel: 'Production' },
  proxmoxbackupserver: { proficiency: 84, years: '2+ yrs', levelLabel: 'Production' },
  pbs: { proficiency: 84, years: '2+ yrs', levelLabel: 'Production' },
  bash: { proficiency: 86, years: '3+ yrs', levelLabel: 'Daily Ops' },
  shellscript: { proficiency: 86, years: '3+ yrs', levelLabel: 'Daily Ops' },
  fastapi: { proficiency: 88, years: '2+ yrs', levelLabel: 'Production' },
  react: { proficiency: 86, years: '2+ yrs', levelLabel: 'Production' },
  flutter: { proficiency: 85, years: '2+ yrs', levelLabel: 'Play Store' },
  nodejs: { proficiency: 84, years: '2+ yrs', levelLabel: 'Production' },
  javascript: { proficiency: 86, years: '3+ yrs', levelLabel: 'Production' },
  typescript: { proficiency: 85, years: '2+ yrs', levelLabel: 'Production' },
  html5: { proficiency: 90, years: '4+ yrs', levelLabel: 'Core Web' },
  css3: { proficiency: 88, years: '4+ yrs', levelLabel: 'Core Web' },
  cpp: { proficiency: 84, years: '3+ yrs', levelLabel: 'Systems' },
  pandas: { proficiency: 88, years: '3+ yrs', levelLabel: 'Analytics' },
  numpy: { proficiency: 86, years: '3+ yrs', levelLabel: 'Analytics' },
  scikitlearn: { proficiency: 80, years: '2+ yrs', levelLabel: 'Applied ML' },
  scikit: { proficiency: 80, years: '2+ yrs', levelLabel: 'Applied ML' },
  powerbi: { proficiency: 84, years: '2+ yrs', levelLabel: 'Enterprise BI' },
  msoffice: { proficiency: 88, years: '4+ yrs', levelLabel: 'Daily Specs' },
  ms: { proficiency: 88, years: '4+ yrs', levelLabel: 'Daily Specs' },
  nocodb: { proficiency: 86, years: '1.5+ yrs', levelLabel: 'Production' },
  kubernetesk3s: { proficiency: 82, years: '1.5+ yrs', levelLabel: 'HA Cluster' },
  kubernetes: { proficiency: 82, years: '1.5+ yrs', levelLabel: 'HA Cluster' },
  nginx: { proficiency: 82, years: '2+ yrs', levelLabel: 'Production' },
  traefik: { proficiency: 82, years: '1.5+ yrs', levelLabel: 'Ingress' },
  metallb: { proficiency: 80, years: '1.5+ yrs', levelLabel: 'Layer-2 VIP' },
  tailscale: { proficiency: 86, years: '2+ yrs', levelLabel: 'Mesh VPN' },
  cloudflare: { proficiency: 85, years: '2+ yrs', levelLabel: 'Zero-Trust' },
  gotify: { proficiency: 82, years: '1.5+ yrs', levelLabel: 'Production' },
  raspberrypi: { proficiency: 80, years: '2+ yrs', levelLabel: 'Edge IoT' },
  nvidiacuda: { proficiency: 74, years: '1.5+ yrs', levelLabel: 'GPU Compute' },
  cuda: { proficiency: 74, years: '1.5+ yrs', levelLabel: 'GPU Compute' },
  java: { proficiency: 76, years: '2+ yrs', levelLabel: 'JVM / Spark' },
  tensorflow: { proficiency: 74, years: '1.5+ yrs', levelLabel: 'Deep Learning' },
  pytorch: { proficiency: 76, years: '1.5+ yrs', levelLabel: 'Deep Learning' },
  coolify: { proficiency: 78, years: '1+ yr', levelLabel: 'Self-Hosted' },
  easypanel: { proficiency: 78, years: '1+ yr', levelLabel: 'Self-Hosted' },
  casaos: { proficiency: 76, years: '1+ yr', levelLabel: 'Self-Hosted' },
  rancher: { proficiency: 72, years: '1+ yr', levelLabel: 'Cluster UI' },
  talosos: { proficiency: 72, years: '1+ yr', levelLabel: 'Immutable OS' },
  talos: { proficiency: 72, years: '1+ yr', levelLabel: 'Immutable OS' },
  homeassistant: { proficiency: 76, years: '1.5+ yrs', levelLabel: 'Automation' },
  go: { proficiency: 74, years: '1+ yr', levelLabel: 'Systems' },
  deltalake: { proficiency: 88, years: '2+ yrs', levelLabel: 'Production' },
  redis: { proficiency: 78, years: '1.5+ yrs', levelLabel: 'Caching' },
  minio: { proficiency: 78, years: '1.5+ yrs', levelLabel: 'Object Store' },
  superset: { proficiency: 80, years: '1.5+ yrs', levelLabel: 'BI Dashboards' },
  kobotoolbox: { proficiency: 76, years: '1+ yr', levelLabel: 'Field Data' },
  aws: { proficiency: 76, years: '1.5+ yrs', levelLabel: 'Cloud Infra' },
};

export const resolveSkillProficiency = (tile: SkillIconTile): ResolvedSkillProficiency => {
  if (typeof tile.proficiency === 'number') {
    const pct = Math.max(20, Math.min(100, Math.round(tile.proficiency)));
    return {
      proficiency: pct,
      years: tile.years || (pct >= 88 ? '3+ yrs' : pct >= 78 ? '2+ yrs' : '1+ yr'),
      levelLabel:
        tile.levelLabel || (pct >= 90 ? 'Core Daily' : pct >= 80 ? 'Production' : 'Working'),
    };
  }

  const keys = [normalizeToken(tile.label), normalizeToken(tile.brandKey)].filter(Boolean);
  for (const key of keys) {
    if (DEFAULT_PROFICIENCY_BY_TOKEN[key]) {
      const hit = DEFAULT_PROFICIENCY_BY_TOKEN[key];
      return {
        proficiency: hit.proficiency,
        years: tile.years || hit.years,
        levelLabel: tile.levelLabel || hit.levelLabel,
      };
    }
  }

  // Substring fallback for compound labels like "SQL & PostgreSQL" or "Proxmox VE & PBS"
  for (const key of keys) {
    const matchedKey = Object.keys(DEFAULT_PROFICIENCY_BY_TOKEN).find(
      (candidate) =>
        candidate.length >= 3 && (key.includes(candidate) || candidate.includes(key))
    );
    if (matchedKey) {
      const hit = DEFAULT_PROFICIENCY_BY_TOKEN[matchedKey];
      return {
        proficiency: hit.proficiency,
        years: tile.years || hit.years,
        levelLabel: tile.levelLabel || hit.levelLabel,
      };
    }
  }

  const connBonus = Math.min(16, (tile.connections?.length ?? 0) * 2);
  const derived = 72 + connBonus;
  return {
    proficiency: derived,
    years: tile.years || (derived >= 84 ? '2+ yrs' : '1+ yr'),
    levelLabel: tile.levelLabel || (derived >= 84 ? 'Production' : 'Working'),
  };
};


