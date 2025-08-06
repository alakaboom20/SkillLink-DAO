import { describe, it, expect, beforeEach } from "vitest"

type MemberData = {
  level: number
  expiresAt: number
  active: boolean
}

const BLOCK_HEIGHT = () => 1000

const mockContract = {
  admin: "STADMIN",
  members: new Map<string, MemberData>(),

  isAdmin(caller: string) {
    return caller === this.admin
  },

  transferAdmin(caller: string, newAdmin: string) {
    if (!this.isAdmin(caller)) return { error: 100 }
    this.admin = newAdmin
    return { value: true }
  },

  addMember(caller: string, user: string, level: number, duration: number) {
    if (!this.isAdmin(caller)) return { error: 100 }
    if (this.members.has(user)) return { error: 103 }
    this.members.set(user, {
      level,
      expiresAt: BLOCK_HEIGHT() + duration,
      active: true
    })
    return { value: true }
  },

  revokeMember(caller: string, user: string) {
    if (!this.isAdmin(caller)) return { error: 100 }
    const m = this.members.get(user)
    if (!m) return { error: 101 }
    m.active = false
    return { value: true }
  },

  extendMembership(caller: string, user: string, extraBlocks: number) {
    if (!this.isAdmin(caller)) return { error: 100 }
    const m = this.members.get(user)
    if (!m) return { error: 101 }
    m.expiresAt += extraBlocks
    return { value: true }
  },

  setLevel(caller: string, user: string, newLevel: number) {
    if (!this.isAdmin(caller)) return { error: 100 }
    const m = this.members.get(user)
    if (!m) return { error: 101 }
    m.level = newLevel
    return { value: true }
  },

  isActiveMember(user: string) {
    const m = this.members.get(user)
    return !!m && m.active && m.expiresAt >= BLOCK_HEIGHT()
  },

  getMember(user: string): { value: MemberData } | { error: number } {
    const m = this.members.get(user)
    return m ? { value: m } : { error: 101 }
  }
}

describe("Membership Manager", () => {
  beforeEach(() => {
    mockContract.members = new Map()
    mockContract.admin = "STADMIN"
  })

  it("adds a new member", () => {
    const res = mockContract.addMember("STADMIN", "ST1USER", 1, 100)
    expect(res).toEqual({ value: true })
    expect(mockContract.members.has("ST1USER")).toBe(true)
  })

  it("rejects non-admin adding member", () => {
    const res = mockContract.addMember("STOTHER", "ST1USER", 1, 100)
    expect(res).toEqual({ error: 100 })
  })

  it("revokes a member", () => {
    mockContract.addMember("STADMIN", "ST1USER", 1, 50)
    const res = mockContract.revokeMember("STADMIN", "ST1USER")
    expect(res).toEqual({ value: true })
    const member = mockContract.members.get("ST1USER")
    expect(member?.active).toBe(false)
  })

  it("extends a membership", () => {
    mockContract.addMember("STADMIN", "ST1USER", 1, 50)
    const oldExpiry = mockContract.members.get("ST1USER")!.expiresAt
    const res = mockContract.extendMembership("STADMIN", "ST1USER", 20)
    expect(res).toEqual({ value: true })
    const newExpiry = mockContract.members.get("ST1USER")!.expiresAt
    expect(newExpiry).toBe(oldExpiry + 20)
  })

  it("changes a member’s level", () => {
    mockContract.addMember("STADMIN", "ST1USER", 1, 50)
    const res = mockContract.setLevel("STADMIN", "ST1USER", 5)
    expect(res).toEqual({ value: true })
    expect(mockContract.members.get("ST1USER")!.level).toBe(5)
  })

  it("checks active status", () => {
    mockContract.addMember("STADMIN", "ST1USER", 1, 50)
    const isActive = mockContract.isActiveMember("ST1USER")
    expect(isActive).toBe(true)
  })

  it("gets member data", () => {
    mockContract.addMember("STADMIN", "ST1USER", 1, 50)
    const res = mockContract.getMember("ST1USER")

    if ("value" in res) {
      expect(res.value?.level).toBe(1)
      expect(res.value?.active).toBe(true)
      expect(typeof res.value?.expiresAt).toBe("number")
    } else {
      throw new Error(`Unexpected error: ${res.error}`)
    }
  })

  it("transfers admin rights", () => {
    const res = mockContract.transferAdmin("STADMIN", "STNEWADMIN")
    expect(res).toEqual({ value: true })
    expect(mockContract.admin).toBe("STNEWADMIN")
  })

  it("prevents non-admin from transferring admin", () => {
    const res = mockContract.transferAdmin("STBADUSER", "STNEWADMIN")
    expect(res).toEqual({ error: 100 })
    expect(mockContract.admin).toBe("STADMIN")
  })
})
