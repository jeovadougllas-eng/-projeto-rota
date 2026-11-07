// Official Capacitor runtime and keyboard handling for Android's edge-to-edge WebView.
import {Capacitor} from '@capacitor/core';
import {Keyboard} from '@capacitor/keyboard';
window.Capacitor=Capacitor;
if(Capacitor.isNativePlatform()){
 const adjust=()=>requestAnimationFrame(()=>{
  window.dispatchEvent(new Event('resize'));
  const focused=document.activeElement;
  if(focused?.matches('input,textarea,select'))focused.scrollIntoView({block:'center',inline:'nearest'});
 });
 Keyboard.addListener('keyboardDidShow',adjust).catch(error=>console.warn('Keyboard listener:',error.message));
 Keyboard.addListener('keyboardDidHide',adjust).catch(error=>console.warn('Keyboard listener:',error.message));
}
