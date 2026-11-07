/** Nachthimmel v2 - features/constellations/catalog.data.js. Extracted from the original v6 app. */
import { FALLBACK_STARS } from '../stars/catalog.data.js';

export const CONST_EXTRA = {
 Ori:{de:'Orion',about:'Der Himmelsj\u00e4ger ist eines der markantesten Wintersternbilder. Seine drei G\u00fcrtelsterne zeigen zur Sirius-Region; im Schwert liegt der Orionnebel M42.',star:'Rigel / Beteigeuze',season:'Winter'},
 UMa:{de:'Gro\u00dfer B\u00e4r',about:'Die sieben hellen Sterne des Gro\u00dfen Wagens bilden den bekanntesten Teil dieses ausgedehnten Sternbilds. Die hinteren Kastensterne weisen zum Polarstern.',star:'Alioth',season:'Ganzj\u00e4hrig (Nordhalbkugel)'},
 UMi:{de:'Kleiner B\u00e4r',about:'Sein hellster Stern, Polaris, steht nahe dem n\u00f6rdlichen Himmelspol und hilft bei der Orientierung.',star:'Polaris',season:'Ganzj\u00e4hrig (Nordhalbkugel)'},
 Cas:{de:'Kassiopeia',about:'Die auff\u00e4llige W-Form liegt gegen\u00fcber dem Gro\u00dfen Wagen auf der anderen Seite des Polarsterns. Benannt nach einer K\u00f6nigin der griechischen Mythologie.',star:'Schedar',season:'Herbst'},
 Cyg:{de:'Schwan',about:'Der Schwan bildet das N\u00f6rdliche Kreuz entlang der Milchstra\u00dfe. Deneb ist eine Ecke des Sommerdreiecks.',star:'Deneb',season:'Sommer / Herbst'},
 Lyr:{de:'Leier',about:'Das kleine Sternbild wird vom sehr hellen Stern Wega dominiert. Zwischen seinen Sternen steht der Ringnebel M57.',star:'Wega',season:'Sommer'},
 Aql:{de:'Adler',about:'Altair ist einer der drei Sterne des Sommerdreiecks. Der Adler liegt beidseits der hellen Sommermilchstra\u00dfe.',star:'Altair',season:'Sommer'},
 Sco:{de:'Skorpion',about:'Das Sternbild folgt einer geschwungenen Sternenkette mit dem r\u00f6tlichen \u00dcberriesen Antares nahe dem Herzen.',star:'Antares',season:'Sommer'},
 Tau:{de:'Stier',about:'Der rote Aldebaran markiert das Auge des Stiers. Im selben Himmelsbereich befinden sich die Hyaden und die Plejaden.',star:'Aldebaran',season:'Winter'},
 Gem:{de:'Zwillinge',about:'Die Sterne Kastor und Pollux bilden die K\u00f6pfe der mythologischen Zwillinge.',star:'Pollux',season:'Winter'},
 And:{de:'Andromeda',about:'In diesem Herbststernbild liegt M31, die Andromedagalaxie, unsere gro\u00dfe Nachbargalaxie in etwa 2,5 Millionen Lichtjahren Entfernung.',star:'Alpheratz',season:'Herbst'},
 Leo:{de:'L\u00f6we',about:'Die Sichel um Regulus bildet Kopf und M\u00e4hne, Denebola markiert den Schwanz des L\u00f6wen.',star:'Regulus',season:'Fr\u00fchling'},
 Boo:{de:'B\u00e4renh\u00fcter',about:'Arktur, einer der hellsten Sterne am Himmel, ist die auff\u00e4lligste Markierung dieses Fr\u00fchlingssternbilds.',star:'Arktur',season:'Fr\u00fchling'},
 Per:{de:'Perseus',about:'Der Held Perseus liegt am Rand des Milchstra\u00dfenbandes. Algol ist ein ber\u00fchmter ver\u00e4nderlicher Stern.',star:'Mirfak',season:'Herbst / Winter'},
 CMa:{de:'Gro\u00dfer Hund',about:'Hier leuchtet Sirius, der hellste Stern des Nachthimmels. Das Sternbild geh\u00f6rt zur Winterregion s\u00fcdlich von Orion.',star:'Sirius',season:'Winter'},
 CrB:{de:'N\u00f6rdliche Krone',about:'Ein Halbkreis aus Sternen rund um die helle Gemma bildet eine auff\u00e4llige Krone.',star:'Gemma',season:'Sommer'},
 Sgr:{de:'Sch\u00fctze',about:'In Richtung Sch\u00fctze blicken wir zum Zentrum unserer Milchstra\u00dfe. Hier liegen viele helle Nebel und Sternhaufen.',star:'Kaus Australis',season:'Sommer'},
 Peg:{de:'Pegasus',about:'Das markante Herbstviereck verbindet Pegasus und Andromeda. Das gefl\u00fcgelte Pferd ist gro\u00dffl\u00e4chig.',star:'Enif',season:'Herbst'},
};

export const named = (name) => { const s = FALLBACK_STARS.find(o => o.name === name); return s ? [s.ra,s.dec] : null; };

export function buildFallbackConstellations() {
 const groups = [
 ['Ori','Orion',[['Betelgeuse','Bellatrix'],['Betelgeuse','Alnitak'],['Bellatrix','Mintaka'],['Mintaka','Alnilam','Alnitak'],['Alnitak','Saiph'],['Alnilam','Rigel'],['Saiph','Rigel']]],
 ['UMa','Ursa Major',[['Dubhe','Merak','Phecda','Megrez','Dubhe'],['Megrez','Alioth','Mizar','Alkaid']]],
 ['Cas','Cassiopeia',[['Caph','Schedar','Gamma Cas','Ruchbah','Segin']]],
 ['Cyg','Cygnus',[['Deneb','Sadr','Albireo'],['Fawaris','Sadr','Gienah Cyg']]],
 ['Lyr','Lyra',[['Vega','Sheliak','Sulafat']]],
 ['Aql','Aquila',[['Tarazed','Altair','Alshain']]],
 ['And','Andromeda',[['Alpheratz','Mirach','Almach']]],
 ['Leo','Leo',[['Regulus','Algieba','Zosma','Denebola']]],
 ['Sco','Scorpius',[['Dschubba','Antares','Sargas','Shaula']]],
 ['Peg','Pegasus',[['Alpheratz','Algenib','Markab','Scheat','Alpheratz']]],
 ['Per','Perseus',[['Mirfak','Algol'],['Mirfak','Atik']]],
 ['CMa','Canis Major',[['Sirius','Adhara','Wezen','Aludra']]],
 ['Boo','Bootes',[['Arcturus','Izar','Nekkar']]],
 ];
 return groups.map(g => {
  const all = g[2].flat().map(named).filter(Boolean);
  const ra = all.reduce((a,p)=>a+p[0],0)/(all.length||1);
  const dec = all.reduce((a,p)=>a+p[1],0)/(all.length||1);
  return {id:g[0],name:g[1],de:CONST_EXTRA[g[0]]?.de || g[1],ra,dec,segments:g[2].map(line=>line.map(named).filter(Boolean)).filter(l=>l.length>1)};
 });
}
