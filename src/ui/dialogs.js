/** Nachthimmel v2 - ui/dialogs.js. Extracted from the original v6 app. */
import { $ } from '../core/dom.js';
import { state } from '../core/store.js';
import { renderDetail } from './details.js';

// Keep dialogs on a separate history entry (same URL) for system Back gestures.
export const HISTORY_OVERLAY_KEY='__nachthimmel_v2_overlay';

export const MODAL_IDS=['searchModal','layersModal','pathsModal','locationModal'];

export function visibleModal(){return MODAL_IDS.find(id=>$(id).classList.contains('visible'))||null;}

export function setModalVisible(id,visible){
 $(id).classList.toggle('visible',visible);
 $(id).setAttribute('aria-hidden',String(!visible));
 if(visible)$(id).querySelector('.settings-body, .search-results')?.scrollTo(0,0);
 else if($(id).contains(document.activeElement))document.activeElement.blur();
}

export function markOverlay(id,replace=false){
 try{
  const prior=history.state && typeof history.state==='object'?history.state:{};
  history[replace?'replaceState':'pushState']({...prior,[HISTORY_OVERLAY_KEY]:id},'');
 }catch(err){/* Keyboard, close buttons and backdrop still work without history. */}
}

export function openModal(id){
 const other=visibleModal();
 if(other===id)return;
 if(other)setModalVisible(other,false);
 markOverlay(id,Boolean(other));
 setModalVisible(id,true);
}

export function closeModal(id){
 if(!$(id).classList.contains('visible'))return;
 setModalVisible(id,false);
 if(history.state?.[HISTORY_OVERLAY_KEY]===id)history.back();
}

export function updateSelection(kind,item,fromHistory=false){
 const next=kind&&item?{kind,item}:null;
 if(next && !fromHistory){
  const modal=visibleModal();
  if(modal)setModalVisible(modal,false);
  if(history.state?.[HISTORY_OVERLAY_KEY]!=='detailPanel')markOverlay('detailPanel',Boolean(modal));
 }else if(!next && state.selected && !fromHistory && history.state?.[HISTORY_OVERLAY_KEY]==='detailPanel'){
  history.back();
 }
 state.selected=next;
 renderDetail();
}

export function restoreOverlayFromHistory(e){
 const target=e.state?.[HISTORY_OVERLAY_KEY];
 for(const id of MODAL_IDS)setModalVisible(id,id===target);
 if(target==='detailPanel' && state.selected){renderDetail();}
 else if(target!=='detailPanel' && !MODAL_IDS.includes(target) && state.selected){
  updateSelection(null,null,true);
 }
}
