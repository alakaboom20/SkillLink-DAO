# SkillLink DAO

A token-gated, decentralized professional network that empowers skilled individuals to verify credentials, join exclusive mentorship communities, and earn rewards — all on-chain.

---

## Overview

SkillLink DAO consists of seven core smart contracts that together form a trustless, reputation-based ecosystem for talent, mentorship, and paid opportunities:

1. **Membership NFT Contract** – Issues and manages access-based NFTs for gated communities.
2. **Skill Verification Contract** – Validates user-submitted credentials and links them to reputation.
3. **Reputation Tracker Contract** – Tracks on-chain contributions like mentorship hours and task completions.
4. **DAO Governance Contract** – Allows verified members to propose and vote on initiatives within each skill DAO.
5. **Mentorship Pod Factory Contract** – Spawns and manages token-gated mentorship groups.
6. **Job Bounty Contract** – Enables employers or DAOs to post jobs with token rewards.
7. **Treasury & Reward Contract** – Distributes funds and reputation points across users and contributors.

---

## Features

- **NFT-based gated communities** by skill or domain  
- **Skill verification** via credential checks and peer attestations  
- **On-chain reputation scoring** for contributors and mentors  
- **Mentorship pods** for small group learning and collaboration  
- **Decentralized governance** within each professional SubDAO  
- **Freelance bounties** with token rewards and milestone tracking  
- **Transparent treasury payouts** based on DAO decisions  

---

## Smart Contracts

### Membership NFT Contract
- Mint NFTs based on skill verification or whitelist
- Enforces access to gated groups and pods
- Supports tiered access (e.g. beginner, expert)

### Skill Verification Contract
- Users submit credentials (stored on IPFS or Chainlink)
- DAO-approved reviewers verify skill claims
- Verified skills are linked to the user’s profile or NFT

### Reputation Tracker Contract
- Tracks mentorship hours, job completions, and community activity
- Points cannot be transferred or sold
- Used to unlock higher-tier access or DAO privileges

### DAO Governance Contract
- Token-weighted voting using NFTs or reputation points
- Proposal submission, voting, and execution
- Modular per-skill or per-subcommunity

### Mentorship Pod Factory Contract
- Creates new mentorship groups on demand
- Pod settings: topic, mentor, size, schedule
- Access limited via Membership NFT or reputation threshold

### Job Bounty Contract
- Post bounties with reward tokens
- Submission and review flow (DAO-verified or employer-signed)
- Reward distribution on approval

### Treasury & Reward Contract
- Holds community funds (e.g. from sponsors or fees)
- Distributes funds to users, pods, and contributors
- Optional staking or vesting logic for future release

---

## Installation

1. Install [Clarinet CLI](https://docs.hiro.so/clarinet/getting-started)
2. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/skilllink-dao.git
   ```
3. Run tests:
    ```bash
    npm test
    ```
4. Deploy contracts:
    ```bash
    clarinet deploy
    ```

## Usage

Each contract serves a modular role in the SkillLink ecosystem and can be extended for specific professions or industries.
Refer to individual contract documentation in the /contracts folder for details on function calls, parameters, and implementation strategies.

## License

MIT License