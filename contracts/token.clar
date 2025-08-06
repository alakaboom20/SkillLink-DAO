;; FanToken.clar
;; Clarity v1

;; Constants
(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INSUFFICIENT-BALANCE u101)
(define-constant ERR-INSUFFICIENT-STAKED u102)
(define-constant ERR-MAX-SUPPLY u103)
(define-constant ERR-PAUSED u104)
(define-constant ERR-ZERO-ADDRESS u105)

(define-constant MAX-SUPPLY u100000000)
(define-constant ZERO-ADDRESS 'SP000000000000000000002Q6VF78)

;; Token metadata
(define-constant TOKEN-NAME "TrueSide Fan Token")
(define-constant TOKEN-SYMBOL "TSFT")
(define-constant TOKEN-DECIMALS u6)

;; State
(define-data-var admin principal tx-sender)
(define-data-var paused bool false)
(define-data-var total-supply uint u0)

(define-map balances principal uint)
(define-map staked-balances principal uint)

;; Private helpers
(define-private (is-admin)
  (is-eq tx-sender (var-get admin)))

(define-private (ensure-not-paused)
  (asserts! (not (var-get paused)) (err ERR-PAUSED)))

;; Admin functions
(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq new-admin ZERO-ADDRESS)) (err ERR-ZERO-ADDRESS))
    (var-set admin new-admin)
    (ok true)))

(define-public (pause (val bool))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (var-set paused val)
    (ok val)))

;; Token functions
(define-public (mint (recipient principal) (amount uint))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq recipient ZERO-ADDRESS)) (err ERR-ZERO-ADDRESS))
    (let ((new-supply (+ (var-get total-supply) amount)))
      (asserts! (<= new-supply MAX-SUPPLY) (err ERR-MAX-SUPPLY))
      (let ((current (default-to u0 (map-get? balances recipient))))
        (map-set balances recipient (+ current amount))
        (var-set total-supply new-supply)
        (ok true)))))

(define-public (burn (amount uint))
  (begin
    (ensure-not-paused)
    (let ((balance (default-to u0 (map-get? balances tx-sender))))
      (asserts! (>= balance amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set balances tx-sender (- balance amount))
      (var-set total-supply (- (var-get total-supply) amount))
      (ok true))))

(define-public (transfer (recipient principal) (amount uint))
  (begin
    (ensure-not-paused)
    (asserts! (not (is-eq recipient ZERO-ADDRESS)) (err ERR-ZERO-ADDRESS))
    (let ((sender-balance (default-to u0 (map-get? balances tx-sender))))
      (asserts! (>= sender-balance amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set balances tx-sender (- sender-balance amount))
      (map-set balances recipient (+ amount (default-to u0 (map-get? balances recipient))))
      (ok true))))

(define-public (stake (amount uint))
  (begin
    (ensure-not-paused)
    (let ((bal (default-to u0 (map-get? balances tx-sender))))
      (asserts! (>= bal amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set balances tx-sender (- bal amount))
      (map-set staked-balances tx-sender (+ amount (default-to u0 (map-get? staked-balances tx-sender))))
      (ok true))))

(define-public (unstake (amount uint))
  (begin
    (ensure-not-paused)
    (let ((staked (default-to u0 (map-get? staked-balances tx-sender))))
      (asserts! (>= staked amount) (err ERR-INSUFFICIENT-STAKED))
      (map-set staked-balances tx-sender (- staked amount))
      (map-set balances tx-sender (+ amount (default-to u0 (map-get? balances tx-sender))))
      (ok true))))

;; Read-only functions
(define-read-only (get-balance (who principal))
  (ok (default-to u0 (map-get? balances who))))

(define-read-only (get-staked (who principal))
  (ok (default-to u0 (map-get? staked-balances who))))

(define-read-only (get-total-supply)
  (ok (var-get total-supply)))

(define-read-only (get-admin)
  (ok (var-get admin)))

(define-read-only (is-paused)
  (ok (var-get paused)))