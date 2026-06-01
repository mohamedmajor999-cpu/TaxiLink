// Banque de lieux courants du département des Bouches-du-Rhône (13).
// Sert à 2 choses dans le flow vocal :
//
//   1. RÉSOLUTION LOCALE : si `coords` est présent, on renvoie label+coords
//      directement sans appel API (gratuit + instantané + précision certaine).
//
//   2. NORMALISATION D'ALIAS : si `coords` est absent, on a quand même un
//      `label` canonique qu'on envoie à Google Places à la place du transcript
//      brut Whisper. Google géocode alors une chaîne propre (ex: "Hôpital
//      Privé Beauregard, 23 Rue des Linots, 13012 Marseille") au lieu du
//      bruit Whisper ("Hôpital Beauregard") → résultat fiable.
//
// Coords vérifiées à la main sur Google Maps quand présents. Pour ajouter
// des coords ensuite, suffit d'éditer `coords: { lat, lng }` sur l'entrée.

export interface KnownPlace {
  /** Label canonique : adresse complète Google-géocodable. */
  label: string
  /** Aliases en minuscules sans accents — matchés en `\b alias \b` sur le
   *  transcript normalisé. Liste de variantes Whisper potentielles. */
  aliases: string[]
  /** Coords vérifiées. Si absent, le label est envoyé à Google pour géocodage. */
  coords?: { lat: number; lng: number }
}

export const KNOWN_PLACES_MARSEILLE: KnownPlace[] = [
  // =====================================================================
  // HÔPITAUX MAJEURS MARSEILLE (coords vérifiées)
  // =====================================================================
  { label: 'Hôpital de la Timone, 264 Rue Saint-Pierre, 13005 Marseille',
    aliases: ['timone', 'la timone', 'hopital timone', 'hopital de la timone', 'chu timone', 'timone adulte'],
    coords: { lat: 43.28760, lng: 5.40140 } },
  { label: 'Hôpital de la Timone Enfants, 264 Rue Saint-Pierre, 13005 Marseille',
    aliases: ['timone enfants', 'hopital enfants timone', 'pediatrie timone'],
    coords: { lat: 43.28710, lng: 5.40270 } },
  { label: 'Hôpital de la Conception, 147 Boulevard Baille, 13005 Marseille',
    aliases: ['conception', 'la conception', 'hopital conception', 'hopital de la conception'],
    coords: { lat: 43.29420, lng: 5.39370 } },
  { label: 'Hôpital Nord, Chemin des Bourrely, 13015 Marseille',
    aliases: ['hopital nord', 'chu nord', 'nord marseille', 'hopital du nord'],
    coords: { lat: 43.34470, lng: 5.36690 } },
  { label: 'Hôpital Européen Marseille, 6 Rue Désirée Clary, 13003 Marseille',
    aliases: ['hopital europeen', 'europeen marseille', 'europeen', 'hopital europeen marseille'],
    coords: { lat: 43.30599, lng: 5.37129 } },
  { label: 'Hôpital Saint-Joseph, 26 Boulevard de Louvain, 13008 Marseille',
    aliases: ['saint joseph', 'saint-joseph', 'hopital saint joseph', 'hopital st joseph', 'st joseph marseille'],
    coords: { lat: 43.27130, lng: 5.39260 } },
  { label: 'Institut Paoli-Calmettes, 232 Boulevard Sainte-Marguerite, 13009 Marseille',
    aliases: ['paoli calmettes', 'paoli-calmettes', 'institut paoli', 'ipc marseille', 'paoli'],
    coords: { lat: 43.25940, lng: 5.40080 } },
  { label: 'Hôpital Sainte-Marguerite, 270 Boulevard Sainte-Marguerite, 13009 Marseille',
    aliases: ['sainte marguerite', 'sainte-marguerite', 'hopital sainte marguerite', 'st marguerite hopital'],
    coords: { lat: 43.26015, lng: 5.40430 } },
  { label: 'Hôpital Salvator, 249 Boulevard Sainte-Marguerite, 13009 Marseille',
    aliases: ['salvator', 'hopital salvator'],
    coords: { lat: 43.26280, lng: 5.40280 } },
  { label: 'Hôpital Privé Clairval, 317 Boulevard du Redon, 13009 Marseille',
    aliases: ['clairval', 'hopital clairval', 'clinique clairval'],
    coords: { lat: 43.24800, lng: 5.42000 } },

  // =====================================================================
  // CLINIQUES MARSEILLE (label canonique, coords non vérifiées → Google)
  // =====================================================================
  { label: 'Hôpital Privé Beauregard, 23 Rue des Linots, 13012 Marseille',
    aliases: ['beauregard', 'hopital beauregard', 'clinique beauregard'] },
  { label: 'Hôpital Européen Desbief, 11 Boulevard Desbief, 13008 Marseille',
    aliases: ['desbief', 'hopital desbief'] },
  { label: 'Clinique Bouchard, 77 Rue du Docteur Escat, 13006 Marseille',
    aliases: ['bouchard', 'clinique bouchard'] },
  { label: 'Clinique La Phocéanne, 10 Boulevard Pinatel, 13012 Marseille',
    aliases: ['la phoceanne', 'phoceanne', 'clinique phoceanne'] },
  { label: 'Clinique de la Casamance, 33 Boulevard des Farigoules, 13400 Aubagne',
    aliases: ['casamance', 'la casamance', 'clinique casamance'] },
  { label: 'Hôpital Saint-Roch, 13007 Marseille',
    aliases: ['saint roch', 'st roch', 'hopital saint roch'] },
  { label: 'Hôpital Saint-Barnabé, Marseille',
    aliases: ['saint barnabe', 'saint-barnabe', 'hopital saint barnabe'] },
  { label: 'Hôpital Édouard Toulouse, 118 Chemin de Mimet, 13015 Marseille',
    aliases: ['edouard toulouse', 'hopital edouard toulouse'] },
  { label: 'Hôpital Valvert, 78 Boulevard des Libérateurs, 13011 Marseille',
    aliases: ['valvert', 'hopital valvert'] },
  { label: 'Hôpital Léon-Bérard, 13007 Marseille',
    aliases: ['leon berard', 'leon-berard', 'hopital leon berard'] },
  { label: 'Centre Gérontologique Départemental, 176 Avenue de Montolivet, 13012 Marseille',
    aliases: ['gerontologique', 'centre gerontologique', 'cgd marseille'] },

  // =====================================================================
  // HÔPITAUX DÉPARTEMENT 13 (hors Marseille)
  // =====================================================================
  { label: "Centre Hospitalier du Pays d'Aix, Avenue des Tamaris, 13616 Aix-en-Provence",
    aliases: ['hopital aix', 'ch aix', 'centre hospitalier aix', 'hopital pays aix'],
    coords: { lat: 43.53180, lng: 5.46280 } },
  { label: 'Centre Hospitalier Edmond Garcin, 179 Avenue des Soeurs Gastine, 13400 Aubagne',
    aliases: ['hopital aubagne', 'ch aubagne', 'edmond garcin'],
    coords: { lat: 43.28780, lng: 5.56970 } },
  { label: "Centre Hospitalier d'Allauch, Chemin des Mille Écus, 13190 Allauch",
    aliases: ['hopital allauch', 'ch allauch'] },
  { label: 'Centre Hospitalier de Martigues, 3 Boulevard des Rayettes, 13500 Martigues',
    aliases: ['hopital martigues', 'ch martigues'] },
  { label: 'Centre Hospitalier de Salon-de-Provence, 207 Avenue Julien Fabre, 13300 Salon-de-Provence',
    aliases: ['hopital salon', 'ch salon', 'hopital salon de provence'] },
  { label: "Centre Hospitalier d'Arles, Quartier Fourchon, 13200 Arles",
    aliases: ['hopital arles', 'ch arles'] },
  { label: "Hôpital Joseph Imbert d'Arles, 13200 Arles",
    aliases: ['joseph imbert', 'imbert arles'] },
  { label: 'Polyclinique du Parc Rambot, 2 Avenue Dr Aurientis, 13100 Aix-en-Provence',
    aliases: ['parc rambot', 'rambot aix', 'polyclinique aix'] },
  { label: 'Clinique Axium, 21 Avenue Henri Mauriat, 13100 Aix-en-Provence',
    aliases: ['axium', 'clinique axium'] },
  { label: 'Centre Hospitalier de Vitrolles, 50 Allée des Hêtres, 13127 Vitrolles',
    aliases: ['hopital vitrolles', 'ch vitrolles'] },

  // =====================================================================
  // TRANSPORTS (coords vérifiées)
  // =====================================================================
  { label: 'Aéroport Marseille Provence, 13700 Marignane',
    aliases: ['aeroport', 'aeroport marseille', 'aeroport mrs', 'marignane', 'aeroport marignane', 'aeroport de marseille', 'aeroport provence', 'mp2', 'aeroport marseille provence'],
    coords: { lat: 43.43961, lng: 5.22141 } },
  { label: 'Gare de Marseille-Saint-Charles, Square Narvik, 13001 Marseille',
    aliases: ['saint charles', 'saint-charles', 'gare saint charles', 'gare st charles', 'gare marseille', 'gare sncf marseille', 'gare saint-charles'],
    coords: { lat: 43.30270, lng: 5.38050 } },
  { label: "Gare d'Aix-en-Provence TGV, 13290 Aix-en-Provence",
    aliases: ['aix tgv', 'gare aix tgv', 'gare tgv aix'],
    coords: { lat: 43.45520, lng: 5.31700 } },
  { label: "Gare Routière d'Aix-en-Provence, Avenue de l'Europe, 13100 Aix-en-Provence",
    aliases: ['gare aix', 'gare aix en provence', 'gare routiere aix'],
    coords: { lat: 43.52640, lng: 5.44320 } },
  { label: 'Gare Maritime de Marseille, Place de la Joliette, 13002 Marseille',
    aliases: ['gare maritime', 'port marseille', 'la joliette ferry', 'terminal ferry', 'port autonome'],
    coords: { lat: 43.30700, lng: 5.36430 } },
  { label: "Gare d'Aubagne, Place Joseph Rau, 13400 Aubagne",
    aliases: ['gare aubagne'] },
  { label: 'Gare de Vitrolles Aéroport Marseille Provence, 13127 Vitrolles',
    aliases: ['gare vitrolles', 'gare vitrolles aeroport'] },
  { label: 'Station de Métro Castellane, 13006 Marseille',
    aliases: ['metro castellane'] },
  { label: 'Station de Métro La Rose, 13013 Marseille',
    aliases: ['metro la rose', 'la rose metro'] },
  { label: 'Station de Métro La Timone, 13005 Marseille',
    aliases: ['metro timone', 'metro la timone'] },

  // =====================================================================
  // SITES EMBLÉMATIQUES MARSEILLE (coords vérifiées)
  // =====================================================================
  { label: 'Vieux-Port de Marseille, 13001 Marseille',
    aliases: ['vieux port', 'vieux-port', 'le vieux port', 'quai du port', 'quai des belges'],
    coords: { lat: 43.29500, lng: 5.37360 } },
  { label: 'Stade Vélodrome (Orange Vélodrome), 3 Boulevard Michelet, 13008 Marseille',
    aliases: ['velodrome', 'stade velodrome', 'orange velodrome', 'om stade', 'stade om'],
    coords: { lat: 43.26970, lng: 5.39610 } },
  { label: 'Notre-Dame de la Garde, Rue Fort du Sanctuaire, 13006 Marseille',
    aliases: ['notre dame de la garde', 'la bonne mere', 'la bonne-mere', 'notre-dame de la garde', 'basilique'],
    coords: { lat: 43.28396, lng: 5.37137 } },
  { label: 'Palais Longchamp, Boulevard Jardin Zoologique, 13004 Marseille',
    aliases: ['palais longchamp', 'longchamp'],
    coords: { lat: 43.30450, lng: 5.39570 } },
  { label: 'MUCEM, 1 Esplanade du J4, 13002 Marseille',
    aliases: ['mucem', 'musee mucem', 'esplanade j4', 'le j4'],
    coords: { lat: 43.29550, lng: 5.36050 } },
  { label: 'Terrasses du Port, 9 Quai du Lazaret, 13002 Marseille',
    aliases: ['terrasses du port', 'centre commercial terrasses', 'terrasses port'],
    coords: { lat: 43.30530, lng: 5.36490 } },
  { label: 'Cathédrale La Major, Place de la Major, 13002 Marseille',
    aliases: ['la major', 'cathedrale major', 'cathedrale la major'],
    coords: { lat: 43.29900, lng: 5.36670 } },
  { label: 'Le Pharo, 58 Boulevard Charles Livon, 13007 Marseille',
    aliases: ['pharo', 'palais du pharo', 'le pharo'],
    coords: { lat: 43.29080, lng: 5.36230 } },
  { label: 'Plage du Prado, Avenue Pierre Mendès France, 13008 Marseille',
    aliases: ['plage du prado', 'prado plage', 'plages du prado'] },
  { label: 'Calanque de Sormiou, 13009 Marseille',
    aliases: ['sormiou', 'calanque sormiou'] },
  { label: 'Calanque de Morgiou, 13009 Marseille',
    aliases: ['morgiou', 'calanque morgiou'] },
  { label: "Calanques de Cassis, 13260 Cassis",
    aliases: ['calanques cassis', 'calanques de cassis'] },

  // =====================================================================
  // QUARTIERS MARSEILLE
  // =====================================================================
  { label: 'Place Castellane, 13006 Marseille',
    aliases: ['castellane', 'place castellane'],
    coords: { lat: 43.28645, lng: 5.38540 } },
  { label: 'La Joliette, 13002 Marseille',
    aliases: ['la joliette', 'joliette', 'place de la joliette'],
    coords: { lat: 43.30620, lng: 5.36720 } },
  { label: 'Le Panier, 13002 Marseille',
    aliases: ['le panier', 'panier', 'quartier du panier'],
    coords: { lat: 43.29970, lng: 5.36850 } },
  { label: 'Frais Vallon, 13013 Marseille',
    aliases: ['frais vallon', 'frais-vallon'] },
  { label: 'La Rose, 13013 Marseille',
    aliases: ['la rose'] },
  { label: 'Saint-Antoine, 13015 Marseille',
    aliases: ['saint antoine', 'saint-antoine', 'st antoine marseille'] },
  { label: 'La Castellane, 13016 Marseille',
    aliases: ['cite la castellane', 'la castellane quartier'] },
  { label: 'Bonneveine, 13008 Marseille',
    aliases: ['bonneveine'] },
  { label: 'Endoume, 13007 Marseille',
    aliases: ['endoume'] },
  { label: 'Saint-Loup, 13010 Marseille',
    aliases: ['saint loup', 'saint-loup', 'st loup'] },
  { label: 'Mazargues, 13009 Marseille',
    aliases: ['mazargues'] },
  { label: 'Les Caillols, 13012 Marseille',
    aliases: ['les caillols', 'caillols'] },
  { label: 'Saint-Just, 13013 Marseille',
    aliases: ['saint just', 'saint-just'] },
  { label: 'Saint-Jérôme, 13013 Marseille',
    aliases: ['saint jerome', 'saint-jerome'] },
  { label: 'La Pomme, 13011 Marseille',
    aliases: ['la pomme', 'quartier la pomme'] },
  { label: 'La Valbarelle, 13011 Marseille',
    aliases: ['la valbarelle', 'valbarelle'] },
  { label: 'La Capelette, 13010 Marseille',
    aliases: ['la capelette', 'capelette'] },
  { label: 'Belsunce, 13001 Marseille',
    aliases: ['belsunce'] },
  { label: 'Cours Julien, 13006 Marseille',
    aliases: ['cours julien', 'cours ju'] },
  { label: 'Noailles, 13001 Marseille',
    aliases: ['noailles', 'place noailles'] },
  { label: 'Les Réformés, 13001 Marseille',
    aliases: ['les reformes', 'reformes', 'place reformes'] },
  { label: 'La Plaine (Place Jean Jaurès), 13006 Marseille',
    aliases: ['la plaine', 'place jean jaures marseille', 'plaine marseille'] },
  { label: 'Le Prado, 13008 Marseille',
    aliases: ['le prado', 'avenue du prado'] },
  { label: 'Le Rouet, 13008 Marseille',
    aliases: ['le rouet', 'rouet marseille'] },

  // =====================================================================
  // COMMUNES DÉPARTEMENT 13
  // =====================================================================
  { label: 'Aix-en-Provence, 13100 Aix-en-Provence',
    aliases: ['aix', 'aix en provence', 'aix-en-provence', 'centre ville aix'],
    coords: { lat: 43.52630, lng: 5.44540 } },
  { label: 'Aubagne, 13400 Aubagne',
    aliases: ['aubagne', 'centre ville aubagne'],
    coords: { lat: 43.29250, lng: 5.57100 } },
  { label: 'Marignane, 13700 Marignane',
    aliases: ['centre marignane', 'mairie marignane'],
    coords: { lat: 43.41360, lng: 5.21500 } },
  { label: 'Vitrolles, 13127 Vitrolles',
    aliases: ['vitrolles', 'centre vitrolles'],
    coords: { lat: 43.45970, lng: 5.24850 } },
  { label: 'Martigues, 13500 Martigues',
    aliases: ['martigues', 'centre martigues'],
    coords: { lat: 43.40550, lng: 5.05450 } },
  { label: 'Salon-de-Provence, 13300 Salon-de-Provence',
    aliases: ['salon', 'salon de provence', 'salon-de-provence'],
    coords: { lat: 43.64080, lng: 5.09690 } },
  { label: 'Cassis, 13260 Cassis',
    aliases: ['cassis', 'port de cassis'],
    coords: { lat: 43.21520, lng: 5.53870 } },
  { label: 'La Ciotat, 13600 La Ciotat',
    aliases: ['la ciotat', 'ciotat'],
    coords: { lat: 43.17350, lng: 5.60500 } },
  { label: 'Allauch, 13190 Allauch',
    aliases: ['allauch', 'centre allauch'],
    coords: { lat: 43.33500, lng: 5.48330 } },
  { label: 'Plan-de-Cuques, 13380 Plan-de-Cuques',
    aliases: ['plan de cuques', 'plan-de-cuques'],
    coords: { lat: 43.34070, lng: 5.46700 } },
  { label: 'Septèmes-les-Vallons, 13240 Septèmes-les-Vallons',
    aliases: ['septemes', 'septemes les vallons', 'septemes-les-vallons'] },
  { label: 'Les Pennes-Mirabeau, 13170 Les Pennes-Mirabeau',
    aliases: ['les pennes', 'les pennes mirabeau', 'pennes-mirabeau'] },
  { label: 'Gardanne, 13120 Gardanne',
    aliases: ['gardanne'] },
  { label: 'Berre-l\'Étang, 13130 Berre-l\'Étang',
    aliases: ['berre', "berre l'etang", 'berre etang'] },
  { label: 'Châteauneuf-les-Martigues, 13220 Châteauneuf-les-Martigues',
    aliases: ['chateauneuf', 'chateauneuf les martigues', 'chateauneuf-les-martigues'] },
  { label: 'Carry-le-Rouet, 13620 Carry-le-Rouet',
    aliases: ['carry', 'carry le rouet', 'carry-le-rouet'] },
  { label: 'Sausset-les-Pins, 13960 Sausset-les-Pins',
    aliases: ['sausset', 'sausset les pins', 'sausset-les-pins'] },
  { label: 'Port-de-Bouc, 13110 Port-de-Bouc',
    aliases: ['port de bouc', 'port-de-bouc'] },
  { label: 'Fos-sur-Mer, 13270 Fos-sur-Mer',
    aliases: ['fos', 'fos sur mer', 'fos-sur-mer'] },
  { label: 'Istres, 13800 Istres',
    aliases: ['istres'] },
  { label: 'Miramas, 13140 Miramas',
    aliases: ['miramas'] },
  { label: 'Gémenos, 13420 Gémenos',
    aliases: ['gemenos'] },
  { label: 'Auriol, 13390 Auriol',
    aliases: ['auriol'] },
  { label: 'Roquefort-la-Bédoule, 13830 Roquefort-la-Bédoule',
    aliases: ['roquefort la bedoule', 'roquefort-la-bedoule', 'roquefort bedoule'] },
  { label: 'La Penne-sur-Huveaune, 13821 La Penne-sur-Huveaune',
    aliases: ['la penne sur huveaune', 'la-penne-sur-huveaune', 'penne huveaune'] },
  { label: 'Carnoux-en-Provence, 13470 Carnoux-en-Provence',
    aliases: ['carnoux', 'carnoux en provence', 'carnoux-en-provence'] },
  { label: 'Cuges-les-Pins, 13780 Cuges-les-Pins',
    aliases: ['cuges', 'cuges les pins', 'cuges-les-pins'] },
  { label: 'Lambesc, 13410 Lambesc',
    aliases: ['lambesc'] },
  { label: 'Saint-Rémy-de-Provence, 13210 Saint-Rémy-de-Provence',
    aliases: ['saint remy', 'saint remy de provence', 'saint-remy', 'st remy provence'] },
  { label: 'Tarascon, 13150 Tarascon',
    aliases: ['tarascon'] },
  { label: 'Saint-Martin-de-Crau, 13310 Saint-Martin-de-Crau',
    aliases: ['saint martin de crau', 'saint-martin-de-crau'] },
  { label: 'Arles, 13200 Arles',
    aliases: ['arles', 'centre arles'],
    coords: { lat: 43.67670, lng: 4.62800 } },
  { label: "Maussane-les-Alpilles, 13520 Maussane-les-Alpilles",
    aliases: ['maussane', 'maussane les alpilles'] },
  { label: 'Eyguières, 13430 Eyguières',
    aliases: ['eyguieres'] },

  // =====================================================================
  // CENTRES COMMERCIAUX & ZONES D'ACTIVITÉ
  // =====================================================================
  { label: 'Centre Commercial Grand Littoral, 11 Avenue de Saint-Antoine, 13015 Marseille',
    aliases: ['grand littoral', 'cc grand littoral'],
    coords: { lat: 43.36720, lng: 5.35370 } },
  { label: 'Centre Commercial La Valentine, 13011 Marseille',
    aliases: ['la valentine', 'cc valentine', 'centre valentine'] },
  { label: 'Centre Commercial Plan de Campagne, 13170 Les Pennes-Mirabeau',
    aliases: ['plan de campagne', 'cc plan de campagne'],
    coords: { lat: 43.42420, lng: 5.36540 } },
  { label: 'Centre Commercial Avant Cap, Boulevard Marius Bremond, 13170 Les Pennes-Mirabeau',
    aliases: ['avant cap', 'cc avant cap'] },
  { label: 'Centre Bourse, 17 Cours Belsunce, 13001 Marseille',
    aliases: ['centre bourse', 'cc bourse'] },
  { label: 'Centre Commercial Carrefour Vitrolles, 13127 Vitrolles',
    aliases: ['carrefour vitrolles'] },
  { label: 'Centre Commercial des Trois Lucs, 13012 Marseille',
    aliases: ['trois lucs', 'les trois lucs', '3 lucs'] },
  { label: "Zone Industrielle des Estroublans, 13127 Vitrolles",
    aliases: ['estroublans', 'zi estroublans'] },
  { label: 'Aix-en-Provence Les Milles, 13290 Aix-en-Provence',
    aliases: ['les milles', 'aix les milles', 'zone les milles'] },
  { label: 'Europôle Méditerranéen de l\'Arbois, 13290 Aix-en-Provence',
    aliases: ['arbois', 'europole arbois'] },

  // =====================================================================
  // ADMINISTRATIONS & SERVICES PUBLICS
  // =====================================================================
  { label: 'Mairie de Marseille (Hôtel de Ville), Quai du Port, 13002 Marseille',
    aliases: ['mairie marseille', 'hotel de ville marseille', 'mairie centrale'],
    coords: { lat: 43.29680, lng: 5.36770 } },
  { label: 'Préfecture des Bouches-du-Rhône, Place Félix Baret, 13006 Marseille',
    aliases: ['prefecture', 'prefecture marseille', 'prefecture bdr'],
    coords: { lat: 43.29130, lng: 5.38090 } },
  { label: 'Tribunal Judiciaire de Marseille, 6 Rue Joseph Autran, 13006 Marseille',
    aliases: ['tribunal', 'tribunal marseille', 'tgi marseille', 'palais de justice marseille'] },
  { label: 'CAF des Bouches-du-Rhône, 215 Chemin de Gibbes, 13014 Marseille',
    aliases: ['caf marseille', 'caf bdr'] },
  { label: 'CPAM Marseille, Boulevard de la Fédération, 13006 Marseille',
    aliases: ['cpam marseille', 'caisse primaire marseille'] },
  { label: "Conseil Départemental des Bouches-du-Rhône, 52 Avenue de Saint-Just, 13004 Marseille",
    aliases: ['conseil departemental', 'conseil general bdr'] },
]

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Cherche un lieu connu du département 13 dans le transcript dicté.
 * Match sur des limites de mot pour éviter les faux positifs.
 *
 * Retour :
 * - `{ ...place }` si un alias matche. Si `place.coords` est défini, l'appelant
 *   peut renvoyer label+coords directement sans Google. Sinon il utilise le
 *   `label` canonique comme query Google (toujours plus propre que le transcript
 *   brut de Whisper, donc taux de réussite plus haut).
 * - `null` si aucun match.
 */
export function findKnownPlaceMarseille(query: string): KnownPlace | null {
  if (!query || query.length < 3) return null
  const normalized = normalize(query)
  for (const place of KNOWN_PLACES_MARSEILLE) {
    for (const alias of place.aliases) {
      const re = new RegExp(`\\b${escapeRegex(alias)}\\b`)
      if (re.test(normalized)) return place
    }
  }
  return null
}
