import { describe, it, expect, beforeEach } from "vitest"

type TierId = string
type FeatureId = string

interface TokenGateState {
  admin: string
  enabled: boolean
  accessTiers: Map<TierId, bigint>
  gatedFeatures: Map<FeatureId, TierId>
}

let state: TokenGateState

beforeEach(() => {
  state = {
    admin: "STADMIN123",
    enabled: true,
    accessTiers: new Map(),
    gatedFeatures: new Map(),
  }
})

function isAdmin(caller: string): boolean {
  return caller === state.admin
}

function defineTier(caller: string, tierId: TierId, minTokens: bigint) {
  if (!isAdmin(caller)) return { error: 100 }
  if (state.accessTiers.has(tierId)) return { error: 102 }
  state.accessTiers.set(tierId, minTokens)
  return { value: true }
}

function assignFeature(caller: string, featureId: FeatureId, tierId: TierId) {
  if (!isAdmin(caller)) return { error: 100 }
  if (!state.accessTiers.has(tierId)) return { error: 103 }
  state.gatedFeatures.set(featureId, tierId)
  return { value: true }
}

function hasAccess(featureId: FeatureId, user: string, tokenBalance: bigint) {
  if (!state.enabled) return { error: 101 }
  const tier = state.gatedFeatures.get(featureId)
  if (!tier) return { error: 103 }
  const min = state.accessTiers.get(tier)
  if (min === undefined) return { error: 103 }
  return tokenBalance >= min ? { value: true } : { error: 104 }
}

describe("Token-Gated Access Control", () => {
  it("should allow admin to define new tier", () => {
    const result = defineTier("STADMIN123", "gold", 1000n)
    expect(result).toEqual({ value: true })
  })

  it("should prevent non-admin from defining tier", () => {
    const result = defineTier("STUSER1", "silver", 500n)
    expect(result).toEqual({ error: 100 })
  })

  it("should assign feature to a tier", () => {
    defineTier("STADMIN123", "silver", 500n)
    const result = assignFeature("STADMIN123", "chat-premium", "silver")
    expect(result).toEqual({ value: true })
  })

  it("should return access true for eligible user", () => {
    defineTier("STADMIN123", "gold", 1000n)
    assignFeature("STADMIN123", "vip-event", "gold")
    const result = hasAccess("vip-event", "STUSER", 1200n)
    expect(result).toEqual({ value: true })
  })

  it("should return error if balance is too low", () => {
    defineTier("STADMIN123", "gold", 1000n)
    assignFeature("STADMIN123", "vip-event", "gold")
    const result = hasAccess("vip-event", "STUSER", 800n)
    expect(result).toEqual({ error: 104 })
  })

  it("should reject access if feature not registered", () => {
    const result = hasAccess("non-existent-feature", "STUSER", 1000n)
    expect(result).toEqual({ error: 103 })
  })

  it("should reject access if system is disabled", () => {
    state.enabled = false
    const result = hasAccess("vip-event", "STUSER", 1500n)
    expect(result).toEqual({ error: 101 })
  })
})
