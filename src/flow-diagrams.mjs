// Geometry follows the same whole-sompi amounts shown in the transaction model.
export function transactionFlow(s){
  const paid=Number(s.paid)/1e8, change=Number(s.change)/1e8;
  const paymentWidth=112*Math.min(12.5,paid)/12.5;
  const changeWidth=112*Math.max(0,change)/12.5;
  return `<svg class="value-flow" viewBox="0 0 600 160" role="img" aria-label="${s.valid?'One input is consumed. Value becomes payment, change, and a fee. Ribbon widths compare payment and change; the fee line is enlarged for visibility.':'The requested payment plus fee exceeds the input. No outputs can be created.'}">
    <path class="flow-guide" d="M20 28H580M20 132H580"/>
    <path class="flow-input" d="M20 80H125" stroke-width="112"/>
    ${s.valid?`<path class="flow-payment" d="M125 ${24+paymentWidth/2} C280 ${24+paymentWidth/2} 310 42 470 42" stroke-width="${paymentWidth}"/><path class="flow-change" d="M125 ${24+paymentWidth+changeWidth/2} C275 ${24+paymentWidth+changeWidth/2} 320 118 470 118" stroke-width="${changeWidth}"/><path class="flow-fee" d="M125 138C290 138 320 154 470 154"/><path class="flow-boundary" d="M125 18V144"/>`:'<path class="flow-rejected" d="M125 80H360M345 65L375 95M345 95L375 65"/><text x="405" y="86">Cannot construct</text>'}
  </svg>`;
}

export function ledgerGlyph(kind){
  const body=kind==='signature'?'<path d="M18 42h26m-26 9h16m22-27 8 8-21 21-12 4 4-12zM51 29l8 8"/>':kind==='block'?'<path d="M16 22h48v38H16zM16 33h48M23 27h11M40 27h17M23 41h5m6 0h23M23 50h5m6 0h23"/>':'<path d="M17 20h46v42H17zM17 32h46M24 26h17M25 46l8 8 20-16"/>';
  return `<svg class="ledger-glyph" viewBox="0 0 80 80" aria-hidden="true"><path class="glyph-frame" d="M8 20 20 8h48v52L56 72H8zM8 20h48v52M56 20 68 8"/>${body}</svg>`;
}
