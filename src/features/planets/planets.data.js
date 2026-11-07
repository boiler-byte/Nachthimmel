/** Nachthimmel v2 - features/planets/planets.data.js. Extracted from the original v6 app. */


// Planet positions without additional network access. JPL's fitted Keplerian
// orbital elements for 1800-2050 (Earth-Moon barycentre approximates Earth).
// J2000 ecliptic frame, light-time correction, then mean-of-date RA/Dec.
// This is NOT an observatory-grade apparent/topocentric ephemeris.
export const AU_KM = 149597870.7;

export const LIGHT_DAYS_PER_AU = .0057755183;

export const PLANETS = [
 {id:'mercury',name:'Merkur',en:'Mercury',type:'Gesteinsplanet',color:'#b5b8c2',light:'#eceff4',dark:'#545e74',radius:2439.4,year:.2408467,rotation:'58,65 Tage',mass:'.3301',
  about:'Der sonnennächste und kleinste Planet hat eine stark verkraterte Oberfläche, kaum eine Atmosphäre und benötigt nur rund 88 Tage für einen Umlauf um die Sonne. Er zeigt von der Erde aus wechselnde Phasen.'},
 {id:'venus',name:'Venus',en:'Venus',type:'Gesteinsplanet',color:'#ebd6a9',light:'#fff2ca',dark:'#99724d',radius:6051.8,year:.61519726,rotation:'243,0 Tage (rückläufig)',mass:'4,867',
  about:'Die Venus ist von dichten Wolken und einer überwiegend aus Kohlendioxid bestehenden Atmosphäre umgeben. Ihr starker Treibhauseffekt macht sie zum heißesten Planeten. Sie erscheint oft als auffälliger Morgen- oder Abendstern.'},
 {id:'mars',name:'Mars',en:'Mars',type:'Gesteinsplanet',color:'#db805e',light:'#ffa777',dark:'#783b34',radius:3389.5,year:1.8808476,rotation:'24,62 Stunden',mass:'0,6417',
  about:'Der rote Planet verdankt seine Farbe eisenoxidhaltigem Staub. Er besitzt polare Eiskappen, gewaltige Vulkane wie Olympus Mons und Spuren früherer Wasseraktivität.'},
 {id:'jupiter',name:'Jupiter',en:'Jupiter',type:'Gasriese',color:'#d5ae80',light:'#f5d5a4',dark:'#94614a',radius:69911,year:11.862615,rotation:'9,92 Stunden',mass:'1898',
  about:'Jupiter ist der größte Planet des Sonnensystems. Seine sichtbaren Wolkenbänder und der Große Rote Fleck – ein langlebiger Wirbelsturm – prägen sein Erscheinungsbild.'},
 {id:'saturn',name:'Saturn',en:'Saturn',type:'Gasriese',color:'#e5cd94',light:'#fff0b6',dark:'#8c7850',radius:58232,year:29.447498,rotation:'10,66 Stunden',mass:'568,3',
  about:'Saturn ist ein Gasriese mit einem ausgedehnten Ringsystem aus überwiegend Eispartikeln. Seine mittlere Dichte ist geringer als die von flüssigem Wasser.'},
 {id:'uranus',name:'Uranus',en:'Uranus',type:'Eisriese',color:'#95d9dc',light:'#c8f4f2',dark:'#467f92',radius:25362,year:84.016846,rotation:'17,24 Stunden (rückläufig)',mass:'86,81',
  about:'Uranus rotiert nahezu auf der Seite: Seine Rotationsachse ist um etwa 98 Grad geneigt. Methan in der Atmosphäre trägt zu seiner blaugrünen Farbe bei.'},
 {id:'neptune',name:'Neptun',en:'Neptune',type:'Eisriese',color:'#638fe8',light:'#a9c7ff',dark:'#274488',radius:24622,year:164.79132,rotation:'16,11 Stunden',mass:'102,4',
  about:'Neptun ist der äußerste der acht Planeten. Seine blaue Erscheinung und sehr starke atmosphärische Winde kennzeichnen diesen fernen Eisriesen; er ist ohne optische Hilfe normalerweise nicht sichtbar.'}
];

// Columns: semimajor axis (au), eccentricity, inclination (deg), mean longitude,
// longitude of perihelion, longitude of ascending node. Each has a /century rate.
export const JPL_ELEMENTS = {
 mercury:[[.38709927,.20563593,7.00497902,252.25032350,77.45779628,48.33076593],[.00000037,.00001906,-.00594749,149472.67411175,.16047689,-.12534081]],
 venus:[[.72333566,.00677672,3.39467605,181.97909950,131.60246718,76.67984255],[.00000390,-.00004107,-.00078890,58517.81538729,.00268329,-.27769418]],
 earth:[[1.00000261,.01671123,-.00001531,100.46457166,102.93768193,0],[.00000562,-.00004392,-.01294668,35999.37244981,.32327364,0]],
 mars:[[1.52371034,.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],[.00001847,.00007882,-.00813131,19140.30268499,.44441088,-.29257343]],
 jupiter:[[5.20288700,.04838624,1.30439695,34.39644051,14.72847983,100.47390909],[-.00011607,-.00013253,-.00183714,3034.74612775,.21252668,.20469106]],
 saturn:[[9.53667594,.05386179,2.48599187,49.95424423,92.59887831,113.66242448],[-.00125060,-.00050991,.00193609,1222.49362201,-.41897216,-.28867794]],
 uranus:[[19.18916464,.04725744,.77263783,313.23810451,170.95427630,74.01692503],[-.00196176,-.00004397,-.00242939,428.48202785,.40805281,.04240589]],
 neptune:[[30.06992276,.00859048,1.77004347,-55.12002969,44.96476227,131.78422574],[.00026291,.00005105,.00035372,218.45945325,-.32241464,-.00508664]]
};
