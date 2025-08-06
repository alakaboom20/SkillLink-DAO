import { describe, it, expect, beforeEach } from "vitest"

const mockContract = {
  proposals: new Map<number, any>(),
  votes: new Set<string>(),
  admin: "STADMIN",
  idCounter: 0,
  MEMBERSHIP_MANAGER: {
    isActiveMember(user: string) {
      return mockContract.activeMembers.has(user)
    }
  },
  activeMembers: new Set<string>(),

  createProposal(caller: string, description: string) {
    const id = ++this.idCounter
    this.proposals.set(id, {
      proposer: caller,
      description,
      votesFor: 0,
      votesAgainst: 0,
      executed: false
    })
    return { value: id }
  },

  vote(caller: string, id: number, support: boolean) {
    const key = `${id}:${caller}`
    if (this.votes.has(key)) return { error: 403 }
    if (!this.MEMBERSHIP_MANAGER.isActiveMember(caller)) return { error: 401 }

    const proposal = this.proposals.get(id)
    if (!proposal) return { error: 404 }

    this.votes.add(key)
    if (support) proposal.votesFor++
    else proposal.votesAgainst++
    return { value: true }
  },

  execute(caller: string, id: number) {
    const proposal = this.proposals.get(id)
    if (!proposal) return { error: 404 }
    if (proposal.executed) return { error: 409 }
    if (proposal.votesFor <= proposal.votesAgainst) return { error: 402 }

    proposal.executed = true
    return { value: true }
  },

  transferAdmin(caller: string, newAdmin: string) {
    if (caller !== this.admin) return { error: 401 }
    this.admin = newAdmin
    return { value: true }
  }
}

describe("Proposal Manager", () => {
  beforeEach(() => {
    mockContract.proposals.clear()
    mockContract.votes.clear()
    mockContract.idCounter = 0
    mockContract.admin = "STADMIN"
    mockContract.activeMembers = new Set(["ST1USER", "ST2USER"])
  })

  it("creates a proposal", () => {
    const res = mockContract.createProposal("ST1USER", "New feature")
    expect(res.value).toBe(1)
  })

  it("votes on a proposal", () => {
    mockContract.createProposal("ST1USER", "Proposal 1")
    const res = mockContract.vote("ST2USER", 1, true)
    expect(res).toEqual({ value: true })
  })

  it("prevents double voting", () => {
    mockContract.createProposal("ST1USER", "Proposal 1")
    mockContract.vote("ST2USER", 1, true)
    const res = mockContract.vote("ST2USER", 1, false)
    expect(res).toEqual({ error: 403 })
  })

  it("rejects non-member voting", () => {
    mockContract.activeMembers.delete("ST2USER")
    mockContract.createProposal("ST1USER", "Proposal 1")
    const res = mockContract.vote("ST2USER", 1, true)
    expect(res).toEqual({ error: 401 })
  })

  it("executes successful proposal", () => {
    mockContract.createProposal("ST1USER", "Proposal 1")
    mockContract.vote("ST1USER", 1, true)
    const res = mockContract.execute("STADMIN", 1)
    expect(res).toEqual({ value: true })
  })

  it("rejects execution of failed proposal", () => {
    mockContract.createProposal("ST1USER", "Proposal 1")
    mockContract.vote("ST1USER", 1, false)
    const res = mockContract.execute("STADMIN", 1)
    expect(res).toEqual({ error: 402 })
  })

  it("transfers admin rights", () => {
    const res = mockContract.transferAdmin("STADMIN", "STNEWADMIN")
    expect(res).toEqual({ value: true })
    expect(mockContract.admin).toBe("STNEWADMIN")
  })

  it("prevents non-admin from transferring admin", () => {
    const res = mockContract.transferAdmin("ST1USER", "STNEWADMIN")
    expect(res).toEqual({ error: 401 })
  })
})
