(define-map memberships 
  { user: principal } 
  { level: uint, expires-at: uint, active: bool }
)

(define-data-var admin principal tx-sender)

(define-event membership-added (user principal) (level uint) (expires-at uint))
(define-event membership-renewed (user principal) (expires-at uint))
(define-event membership-deactivated (user principal))
(define-event admin-transferred (new-admin principal))

(define-read-only (get-membership (user principal))
  (match (map-get memberships { user: user })
    m (ok 
         {
           level: (get level m),
           expires-at: (get expires-at m),
           active: (get active m)
         }
       )
    (err u100) ;; membership not found
  )
)

(define-public (add-member (user principal) (level uint) (duration uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u401)) ;; unauthorized
    (let ((expiry (+ (block-height) duration)))
      (map-set memberships 
        { user: user }
        { level: level, expires-at: expiry, active: true }
      )
      (emit-event (membership-added user level expiry))
      (ok true)
    )
  )
)

(define-public (renew-membership (user principal) (extra-blocks uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u401)) ;; unauthorized
    (match (map-get memberships { user: user })
      m
        (let (
              (new-expiry (+ (get expires-at m) extra-blocks))
              (level (get level m))
              (active (get active m))
            )
          (map-set memberships 
            { user: user }
            { level: level, expires-at: new-expiry, active: active }
          )
          (emit-event (membership-renewed user new-expiry))
          (ok true)
        )
      (err u100) ;; membership not found
    )
  )
)

(define-public (deactivate-membership (user principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u401)) ;; unauthorized
    (match (map-get memberships { user: user })
      m
        (let (
              (level (get level m))
              (expires-at (get expires-at m))
            )
          (map-set memberships 
            { user: user }
            { level: level, expires-at: expires-at, active: false }
          )
          (emit-event (membership-deactivated user))
          (ok true)
        )
      (err u100)
    )
  )
)

(define-read-only (is-active-member (user principal))
  (match (map-get memberships { user: user })
    m
      (ok (and (get active m) (>= (get expires-at m) (block-height))))
    (err u100)
  )
)

(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u401))
    (var-set admin new-admin)
    (emit-event (admin-transferred new-admin))
    (ok true)
  )
)
