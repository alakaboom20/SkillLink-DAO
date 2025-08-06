// FanToken.mock.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Principal = string;

interface FanTokenContract {
  getBalance: (who: Principal) => Promise<number>;
  transfer: (to: Principal, amount: number, sender: Principal) => Promise<boolean>;
  mint: (to: Principal, amount: number, sender: Principal) => Promise<boolean>;
  stake: (amount: number, sender: Principal) => Promise<boolean>;
  unstake: (amount: number, sender: Principal) => Promise<boolean>;
  pause: (flag: boolean, sender: Principal) => Promise<boolean>;
  isPaused: () => Promise<boolean>;
}

describe('FanToken Contract (Mocked)', () => {
  let contract: FanTokenContract;
  let balances: Record<Principal, number>;
  let staked: Record<Principal, number>;
  let admin: Principal;
  let paused: boolean;

  const user1 = 'wallet_1';
  const user2 = 'wallet_2';

  beforeEach(() => {
    // Reset state before each test
    balances = { [user1]: 1000, [user2]: 0 };
    staked = { [user1]: 0, [user2]: 0 };
    admin = 'deployer';
    paused = false;

    // Mock contract interface
    contract = {
      getBalance: vi.fn(async (who: Principal) => balances[who] || 0),
      transfer: vi.fn(async (to, amount, sender) => {
        if (paused) throw new Error('ERR_PAUSED');
        if (balances[sender] < amount) throw new Error('ERR_INSUFFICIENT_BALANCE');
        balances[sender] -= amount;
        balances[to] = (balances[to] || 0) + amount;
        return true;
      }),
      mint: vi.fn(async (to, amount, sender) => {
        if (sender !== admin) throw new Error('ERR_NOT_AUTHORIZED');
        balances[to] = (balances[to] || 0) + amount;
        return true;
      }),
      stake: vi.fn(async (amount, sender) => {
        if (paused) throw new Error('ERR_PAUSED');
        if (balances[sender] < amount) throw new Error('ERR_INSUFFICIENT_BALANCE');
        balances[sender] -= amount;
        staked[sender] += amount;
        return true;
      }),
      unstake: vi.fn(async (amount, sender) => {
        if (paused) throw new Error('ERR_PAUSED');
        if (staked[sender] < amount) throw new Error('ERR_INSUFFICIENT_STAKED');
        staked[sender] -= amount;
        balances[sender] += amount;
        return true;
      }),
      pause: vi.fn(async (flag, sender) => {
        if (sender !== admin) throw new Error('ERR_NOT_AUTHORIZED');
        paused = flag;
        return true;
      }),
      isPaused: vi.fn(async () => paused),
    };
  });

  it('mints tokens to user1 by admin', async () => {
    const result = await contract.mint(user1, 500, admin);
    expect(result).toBe(true);
    expect(await contract.getBalance(user1)).toBe(1500);
  });

  it('fails to mint by non-admin', async () => {
    await expect(contract.mint(user2, 500, user1)).rejects.toThrow('ERR_NOT_AUTHORIZED');
  });

  it('transfers tokens between users', async () => {
    const result = await contract.transfer(user2, 200, user1);
    expect(result).toBe(true);
    expect(await contract.getBalance(user1)).toBe(800);
    expect(await contract.getBalance(user2)).toBe(200);
  });

  it('fails to transfer when paused', async () => {
    await contract.pause(true, admin);
    await expect(contract.transfer(user2, 10, user1)).rejects.toThrow('ERR_PAUSED');
  });

  it('stakes tokens correctly', async () => {
    const result = await contract.stake(300, user1);
    expect(result).toBe(true);
    expect(await contract.getBalance(user1)).toBe(700);
    expect(staked[user1]).toBe(300);
  });

  it('unstakes tokens correctly', async () => {
    await contract.stake(300, user1);
    const result = await contract.unstake(200, user1);
    expect(result).toBe(true);
    expect(await contract.getBalance(user1)).toBe(900);
    expect(staked[user1]).toBe(100);
  });

  it('rejects unstake if insufficient stake', async () => {
    await contract.stake(100, user1);
    await expect(contract.unstake(200, user1)).rejects.toThrow('ERR_INSUFFICIENT_STAKED');
  });

  it('pauses and unpauses by admin', async () => {
    await contract.pause(true, admin);
    expect(await contract.isPaused()).toBe(true);
    await contract.pause(false, admin);
    expect(await contract.isPaused()).toBe(false);
  });

  it('non-admin cannot pause the contract', async () => {
    await expect(contract.pause(true, user1)).rejects.toThrow('ERR_NOT_AUTHORIZED');
  });
});
