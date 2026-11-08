// Educational interactive page explaining ledger principles using plain-English analogies and GSAP animations
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

export default function HowItWorks() {
  // Refs for Step 1: Double-Entry Animation
  const coinRef = useRef(null);
  const debitRowRef = useRef(null);
  const creditRowRef = useRef(null);
  const step1Timeline = useRef(null);

  // Refs for Step 3: Derived Balance Counter Animation
  const balanceCountRef = useRef(null);
  const entry1Ref = useRef(null);
  const entry2Ref = useRef(null);
  const entry3Ref = useRef(null);
  const step3Timeline = useRef(null);

  // Refs for Step 4: Idempotency Animation
  const req1Ref = useRef(null);
  const req2Ref = useRef(null);
  const status1Ref = useRef(null);
  const status2Ref = useRef(null);
  const step4Timeline = useRef(null);

  useEffect(() => {
    // ----------------------------------------------------
    // Step 1: Coin transfer + two ledger rows appearing
    // ----------------------------------------------------
    const tl1 = gsap.timeline({ repeat: -1, repeatDelay: 2 });
    tl1.set(coinRef.current, { x: 0, opacity: 1 })
       .set([debitRowRef.current, creditRowRef.current], { opacity: 0, y: 10 })
       .to(coinRef.current, { x: 180, duration: 1.2, ease: 'power2.inOut' })
       .to(debitRowRef.current, { opacity: 1, y: 0, duration: 0.4 }, '-=0.3')
       .to(creditRowRef.current, { opacity: 1, y: 0, duration: 0.4 }, '-=0.2')
       .to(coinRef.current, { opacity: 0, duration: 0.3 }, '+=1');

    step1Timeline.current = tl1;

    // ----------------------------------------------------
    // Step 3: Running total summing entries dynamically
    // ----------------------------------------------------
    const tl3 = gsap.timeline({ repeat: -1, repeatDelay: 2 });
    const counterObj = { val: 0 };

    tl3.set([entry1Ref.current, entry2Ref.current, entry3Ref.current], { opacity: 0.3 })
       .call(() => {
         if (balanceCountRef.current) balanceCountRef.current.innerText = '₹ 0';
       })
       // Entry 1: +1,000
       .to(entry1Ref.current, { opacity: 1, duration: 0.4 })
       .to(counterObj, {
         val: 1000,
         duration: 0.6,
         onUpdate: () => {
           if (balanceCountRef.current) {
             balanceCountRef.current.innerText = `₹ ${Math.round(counterObj.val)}`;
           }
         },
       })
       // Entry 2: -300
       .to(entry2Ref.current, { opacity: 1, duration: 0.4 })
       .to(counterObj, {
         val: 700,
         duration: 0.6,
         onUpdate: () => {
           if (balanceCountRef.current) {
             balanceCountRef.current.innerText = `₹ ${Math.round(counterObj.val)}`;
           }
         },
       })
       // Entry 3: +500
       .to(entry3Ref.current, { opacity: 1, duration: 0.4 })
       .to(counterObj, {
         val: 1200,
         duration: 0.6,
         onUpdate: () => {
           if (balanceCountRef.current) {
             balanceCountRef.current.innerText = `₹ ${Math.round(counterObj.val)}`;
           }
         },
       });

    step3Timeline.current = tl3;

    // ----------------------------------------------------
    // Step 4: Duplicate request idempotency filter
    // ----------------------------------------------------
    const tl4 = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });
    tl4.set([req1Ref.current, req2Ref.current], { x: 0, opacity: 0 })
       .set(status1Ref.current, { opacity: 0 })
       .set(status2Ref.current, { opacity: 0 })
       // Request 1 arrives
       .to(req1Ref.current, { opacity: 1, x: 80, duration: 0.8, ease: 'power2.out' })
       .to(status1Ref.current, { opacity: 1, duration: 0.4 })
       // Request 2 (duplicate key) arrives
       .to(req2Ref.current, { opacity: 1, x: 80, duration: 0.8, ease: 'power2.out' }, '+=0.4')
       .to(status2Ref.current, { opacity: 1, duration: 0.4 });

    step4Timeline.current = tl4;

    return () => {
      tl1.kill();
      tl3.kill();
      tl4.kill();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
      {/* Introduction */}
      <div className="border-b border-white/20 pb-8 text-center sm:text-left">
        <span className="text-xs font-mono uppercase tracking-widest text-white/50 block mb-2">
          Architecture & Principles
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase">
          How Real Bank Ledgers Work
        </h1>
        <p className="text-sm text-white/70 mt-3 max-w-2xl leading-relaxed">
          Think of a real-world bank not as a database with editable numbers, but as a{' '}
          <strong className="text-white">physical notebook written in permanent ink</strong>. Every financial event is an audit trail.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            to="/login"
            className="border border-white bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-opacity"
          >
            Get Started →
          </Link>
        </div>
      </div>

      {/* Step 1: Double-Entry */}
      <section className="border border-white/20 p-6 sm:p-8 bg-black">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-6 h-6 rounded-full border border-white text-xs flex items-center justify-center font-mono">1</span>
          <h2 className="text-lg font-bold uppercase tracking-wider">
            Double-Entry: Money Never Disappears
          </h2>
        </div>
        <p className="text-xs text-white/70 leading-relaxed max-w-2xl">
          Money cannot simply appear or vanish. When ₹100 moves from Alice to Bob, the system writes <em>two simultaneous entries</em> inside a single atomic database transaction: a DEBIT on Alice’s account and a CREDIT on Bob’s account.
        </p>

        {/* Visual Animation 1 */}
        <div className="mt-8 border border-white/10 p-6 bg-white/[0.02]">
          <div className="flex items-center justify-between max-w-md mx-auto mb-6 text-xs font-mono">
            <div className="border border-white/40 p-3 w-28 text-center bg-black">
              <div className="text-[10px] text-white/40">SENDER</div>
              Account A
            </div>

            {/* Traveling Coin */}
            <div className="relative flex-1 flex items-center justify-center h-8">
              <div
                ref={coinRef}
                className="w-7 h-7 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center shadow-md absolute left-2"
              >
                ₹
              </div>
              <div className="w-full border-t border-dashed border-white/30"></div>
            </div>

            <div className="border border-white/40 p-3 w-28 text-center bg-black">
              <div className="text-[10px] text-white/40">RECEIVER</div>
              Account B
            </div>
          </div>

          {/* Appearing Ledger Rows */}
          <div className="max-w-md mx-auto space-y-2 font-mono text-xs">
            <div className="text-[10px] uppercase text-white/40 tracking-wider mb-1">Recorded Ledger Entries:</div>
            <div
              ref={debitRowRef}
              className="border border-white/30 p-2 bg-black flex justify-between items-center"
            >
              <span>Account A</span>
              <span className="text-white/60">₹ 100</span>
              <span className="border border-white/40 px-2 py-0.5 text-[10px]">DEBIT</span>
            </div>
            <div
              ref={creditRowRef}
              className="border border-white/30 p-2 bg-black flex justify-between items-center"
            >
              <span>Account B</span>
              <span className="text-white/60">₹ 100</span>
              <span className="border border-white/40 px-2 py-0.5 text-[10px]">CREDIT</span>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2: Append-Only Immutability */}
      <section className="border border-white/20 p-6 sm:p-8 bg-black">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-6 h-6 rounded-full border border-white text-xs flex items-center justify-center font-mono">2</span>
          <h2 className="text-lg font-bold uppercase tracking-wider">
            Append-Only: Ink, Never Pencil
          </h2>
        </div>
        <p className="text-xs text-white/70 leading-relaxed max-w-2xl">
          In our backend, the Mongoose Ledger model intercepts all <code className="text-white bg-white/10 px-1">updateOne</code>, <code className="text-white bg-white/10 px-1">deleteOne</code>, and <code className="text-white bg-white/10 px-1">findOneAndUpdate</code> operations and rejects them. Once written, a record can never be modified or erased.
        </p>

        <div className="mt-6 border border-white/10 p-6 bg-white/[0.02] max-w-md mx-auto">
          <div className="space-y-2 text-xs font-mono">
            <div className="border border-white/30 p-2.5 flex items-center justify-between bg-black">
              <span>TX_001 · CREDIT ₹ 500</span>
              <span className="text-[10px] bg-white text-black px-1.5 py-0.5 font-bold">LOCKED</span>
            </div>
            <div className="border border-white/30 p-2.5 flex items-center justify-between bg-black">
              <span>TX_002 · DEBIT ₹ 200</span>
              <span className="text-[10px] bg-white text-black px-1.5 py-0.5 font-bold">LOCKED</span>
            </div>
            <div className="border border-white/30 p-2.5 flex items-center justify-between opacity-50 bg-black">
              <span className="line-through">DELETE / UPDATE ATTEMPT</span>
              <span className="text-[10px] border border-white text-white px-1.5 py-0.5 font-bold">REJECTED 403</span>
            </div>
          </div>
        </div>
      </section>

      {/* Step 3: Derived Balance */}
      <section className="border border-white/20 p-6 sm:p-8 bg-black">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-6 h-6 rounded-full border border-white text-xs flex items-center justify-center font-mono">3</span>
          <h2 className="text-lg font-bold uppercase tracking-wider">
            Derived Balance: Added Up, Not Stored
          </h2>
        </div>
        <p className="text-xs text-white/70 leading-relaxed max-w-2xl">
          There is no <code className="text-white bg-white/10 px-1">balance</code> column in the database table. Stored balances can get corrupted or out of sync. Instead, whenever you check your balance, MongoDB runs an aggregation query:
        </p>
        <div className="mt-3 font-mono text-xs text-white/90 border border-white/20 p-2 bg-white/5 inline-block">
          Balance = Total Credits − Total Debits
        </div>

        {/* Visual Animation 3 */}
        <div className="mt-6 border border-white/10 p-6 bg-white/[0.02] max-w-md mx-auto">
          <div className="space-y-2 text-xs font-mono mb-4">
            <div ref={entry1Ref} className="border border-white/20 p-2 flex justify-between bg-black">
              <span>Initial Deposit</span>
              <span className="text-white font-bold">+ ₹ 1,000 (CREDIT)</span>
            </div>
            <div ref={entry2Ref} className="border border-white/20 p-2 flex justify-between bg-black">
              <span>Payment to Merchant</span>
              <span className="text-white/70">- ₹ 300 (DEBIT)</span>
            </div>
            <div ref={entry3Ref} className="border border-white/20 p-2 flex justify-between bg-black">
              <span>Transfer Received</span>
              <span className="text-white font-bold">+ ₹ 500 (CREDIT)</span>
            </div>
          </div>

          <div className="border-t border-white/20 pt-4 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-white/60">Dynamic Calculation:</span>
            <span ref={balanceCountRef} className="text-2xl font-mono font-bold text-white">
              ₹ 0
            </span>
          </div>
        </div>
      </section>

      {/* Step 4: Idempotency */}
      <section className="border border-white/20 p-6 sm:p-8 bg-black">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-6 h-6 rounded-full border border-white text-xs flex items-center justify-center font-mono">4</span>
          <h2 className="text-lg font-bold uppercase tracking-wider">
            Idempotency: Same Request = Charged Once
          </h2>
        </div>
        <p className="text-xs text-white/70 leading-relaxed max-w-2xl">
          If your internet lags and you press "Transfer" twice, a naive bank might charge you twice. Our system requires a unique <code className="text-white bg-white/10 px-1">idempotencyKey</code> (UUID) with each request. If the backend sees a key that was already completed, it returns the existing receipt without deducting another penny.
        </p>

        {/* Visual Animation 4 */}
        <div className="mt-6 border border-white/10 p-6 bg-white/[0.02] max-w-md mx-auto font-mono text-xs">
          <div className="relative h-28 border border-white/20 p-3 bg-black flex flex-col justify-around">
            <div className="flex items-center justify-between">
              <div ref={req1Ref} className="border border-white/40 px-2 py-1 bg-white/10 text-[11px]">
                Req #1 [UUID: c4a1]
              </div>
              <span ref={status1Ref} className="text-[10px] border border-white bg-white text-black px-2 py-0.5 font-bold">
                PROCESSED
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div ref={req2Ref} className="border border-white/40 px-2 py-1 bg-white/10 text-[11px]">
                Req #2 [UUID: c4a1] (Duplicate)
              </div>
              <span ref={status2Ref} className="text-[10px] border border-white text-white px-2 py-0.5">
                IGNORED (ALREADY DONE)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="border border-white/20 p-8 text-center bg-black">
        <h2 className="text-xl font-bold uppercase tracking-wide mb-2">Ready to try it yourself?</h2>
        <p className="text-xs text-white/60 mb-6 max-w-md mx-auto">
          Create an account, view derived ledger balances, and execute double-entry transfers in real time.
        </p>
        <Link
          to="/login"
          className="inline-block border border-white bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-opacity"
        >
          Get Started Now →
        </Link>
      </div>
    </div>
  );
}

