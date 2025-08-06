;; Token Gate Contract - SkillLink MVP
;; Clarity v1
;; Gate access to features based on token tier requirements

(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-NOT-ENABLED u101)
(define-constant ERR-TIER-NOT-FOUND u102)
(define-constant ERR-NO-ACCESS u103)
(define-constant ERR-INVALID-ID u104)

;; Admin and state
(define-data-var admin principal tx-sender)
(define-data-var enabled bool true)

;; Map of tier => minimum required tokens
(define-map access-tiers (buff 32) uint)

;; Map of feature => required tier
(define-map gated-features (buff 32) (buff 32))

;; ================================
;; Internal helpers
;; ================================

(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

(define-private (not-zero-buff (id (buff 32)))
  (not (is-eq id (buff 32 0x00)))
)

;; ================================
;; Admin functions
;; ================================

(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (var-set admin new-admin)
    (ok true)
  )
)

(define-public (set-enabled (flag bool))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (var-set enabled flag)
    (ok flag)
  )
)

(define-public (define-tier (tier-id (buff 32)) (min-required uint))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (not-zero-buff tier-id) (err ERR-INVALID-ID))
    (map-set access-tiers tier-id min-required)
    (ok true)
  )
)

(define-public (assign-feature (feature-id (buff 32)) (tier-id (buff 32)))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (not-zero-buff feature-id) (err ERR-INVALID-ID))
    (map-set gated-features feature-id tier-id)
    (ok true)
  )
)

;; ================================
;; Access Control
;; ================================

(define-read-only (has-access? (feature-id (buff 32)) (user principal) (token-balance uint))
  (if (not (var-get enabled))
      (err ERR-NOT-ENABLED)
      (match (map-get? gated-features feature-id)
        (some tier-id)
          (match (map-get? access-tiers tier-id)
            (some min-tokens)
              (if (>= token-balance min-tokens)
                  (ok true)
                  (err ERR-NO-ACCESS))
            (none) (err ERR-TIER-NOT-FOUND))
        (none) (err ERR-TIER-NOT-FOUND))
  )
)

;; ================================
;; Read-only getters
;; ================================

(define-read-only (get-admin) (ok (var-get admin)))
(define-read-only (is-enabled) (ok (var-get enabled)))
(define-read-only (get-tier-minimum (tier-id (buff 32)))
  (ok (map-get? access-tiers tier-id))
)
(define-read-only (get-feature-tier (feature-id (buff 32)))
  (ok (map-get? gated-features feature-id))
)
