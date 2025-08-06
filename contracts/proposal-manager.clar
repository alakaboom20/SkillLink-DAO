(define-data-var admin principal tx-sender)
(define-data-var proposal-id-counter uint u0)

(define-map proposals
  uint
  {
    proposer: principal,
    description: (string-ascii 256),
    votes-for: uint,
    votes-against: uint,
    executed: bool
  }
)

(define-map has-voted
  {
    proposal-id: uint,
    voter: principal
  }
  bool
)

(define-trait membership-manager-trait
  (
    (is-active-member (principal) (response bool uint))
  )
)

(define-constant MEMBERSHIP-MANAGER .membership-manager)

(define-read-only (get-proposal (id uint))
  (match (map-get? proposals id)
    proposal (ok proposal)
    (err u404)
  )
)

(define-public (create-proposal (description (string-ascii 256)))
  (let
    (
      (caller tx-sender)
      (next-id (+ (var-get proposal-id-counter) u1))
    )
    (begin
      (var-set proposal-id-counter next-id)
      (map-set proposals next-id
        {
          proposer: caller,
          description: description,
          votes-for: u0,
          votes-against: u0,
          executed: false
        }
      )
      (ok next-id)
    )
  )
)

(define-public (vote (id uint) (support bool))
  (let
    (
      (caller tx-sender)
      (already-voted (map-get? has-voted { proposal-id: id, voter: caller }))
    )
    (begin
      (if (is-some already-voted)
        (err u403)
        (ok true)
      )

      (match (contract-call? MEMBERSHIP-MANAGER is-active-member caller)
        result
          (if result
            none
            (err u401)
          )
        err (err err)
      )

      (map-set has-voted { proposal-id: id, voter: caller } true)

      (match (map-get? proposals id)
        proposal
          (let
            (
              (votes-for (get votes-for proposal))
              (votes-against (get votes-against proposal))
              (proposer (get proposer proposal))
              (description (get description proposal))
              (executed (get executed proposal))
            )
            (if support
              (map-set proposals id
                {
                  proposer: proposer,
                  description: description,
                  votes-for: (+ votes-for u1),
                  votes-against: votes-against,
                  executed: executed
                }
              )
              (map-set proposals id
                {
                  proposer: proposer,
                  description: description,
                  votes-for: votes-for,
                  votes-against: (+ votes-against u1),
                  executed: executed
                }
              )
            )
            (ok true)
          )
        (err u404)
      )
    )
  )
)

(define-public (execute (id uint))
  (match (map-get? proposals id)
    proposal
      (let
        (
          (executed (get executed proposal))
          (votes-for (get votes-for proposal))
          (votes-against (get votes-against proposal))
          (proposer (get proposer proposal))
          (description (get description proposal))
        )
        (if executed
          (err u409)
          (if (> votes-for votes-against)
            (begin
              (map-set proposals id
                {
                  proposer: proposer,
                  description: description,
                  votes-for: votes-for,
                  votes-against: votes-against,
                  executed: true
                }
              )
              (ok true)
            )
            (err u402)
          )
        )
      )
    (err u404)
  )
)

(define-public (transfer-admin (new-admin principal))
  (if (is-eq tx-sender (var-get admin))
    (begin
      (var-set admin new-admin)
      (ok true)
    )
    (err u401)
  )
)
