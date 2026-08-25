const modal = document.querySelector('#modal');
function openModal(name){ document.querySelector('#modal-title').textContent=name; modal.classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(){ modal.classList.remove('open'); document.body.style.overflow=''; }
function confirmBooking(){ const title=document.querySelector('#modal-title').textContent; closeModal(); alert(`Reserva confirmada en ${title}. La verás en “Mis reservas”.`); }
document.querySelectorAll('.heart').forEach(button=>button.addEventListener('click',()=>{button.textContent=button.textContent==='♡'?'♥':'♡';button.style.color=button.textContent==='♥'?'#b25555':'var(--deep)'}));
