/* Classical Myth in Art, condensed edition (Oct 2026). Facts from museum records; see sources.js. */
window.SITE = {
  title: 'Classical Myth in Art',
  sections: { 1: 'Gods and stories', 2: 'Heroes and Troy', 3: 'Reading myth' },
  handouts: []
};

/* ---------- Module 1 ---------- */
SITE.handouts.push({
  n: 1, wk: 1, title: 'The Gods of Olympus', sub: 'Who the gods are, and how artists made each one recognizable',
  overview: {
    img: 'h1_aphrodite', cap: ['Sandro Botticelli', 'The Birth of Venus', 'c. 1485'],
    sum: 'The Greeks pictured their gods as a family of twelve living on Mount Olympus, and the Romans took them over under Latin names. Because the gods look human, artists marked each one with a fixed set of objects, animals and poses, so a viewer could name the god at a glance.',
    bul: ['Ancient statues set the standard types that later painters copied.', 'Renaissance and Baroque artists revived the gods for princely palaces and collections.', 'Learn the attributes here and the rest of the guide becomes easier to read.'],
    terms: [['Attribute', 'An object, animal or feature that identifies a figure, such as Zeus’s thunderbolt or Athena’s owl and aegis.']]
  },
  slides: [
    { type: 'work', key: 'h1_zeus', artist: 'Roman, sculptor unknown', title: 'Jupiter of Smyrna', date: '2nd century CE', det: 'Marble, 270 cm high · Louvre, Paris',
      lead: 'An over-life-size statue, carved in the province of Asia and possibly copied from a Greek original about three centuries older. Much of what you see was rebuilt for Louis XIV.',
      bul: ['Recorded at Smyrna (modern İzmir) in 1680, owned by a Dutch merchant, and bought for Louis XIV.', 'Pierre Granier restored it in 1686: the shoulder, raised arm and thunderbolt, nose, feet and base are his.', 'Stood on the Allée Royale at Versailles from 1687; moved to the museum after the Revolution.', 'Look for the deep drill work in the hair and beard, typical of 2nd-century Roman carving.', 'Since the thunderbolt is modern, the museum also lists Asclepius, god of healing, as a possible identity.'],
      subj: 'Zeus (Roman Jupiter) is king of the gods and god of sky and thunder, who took power by overthrowing his father Cronus. Sculptors showed him as a mature, bearded man, bare-chested, with scepter and thunderbolt.',
      terms: [['Himation', 'A large rectangular cloak worn by Greek men.']] },
    { type: 'work', key: 'h1_hera', artist: 'Peter Paul Rubens', title: 'Juno and Argus', date: 'c. 1610', det: 'Oil on canvas, 249 × 296 cm · Wallraf-Richartz-Museum, Cologne',
      lead: 'Painted soon after the artist came home to Antwerp from eight years in Italy, the picture is a showcase for the Venetian colour he had just studied.',
      bul: ['Juno lifts the eyes from the headless body of Argus, helped by Iris, goddess of the rainbow, and a crowd of putti.', 'A rainbow runs through the centre; the museum notes the picture is built on blue, yellow and red.', 'Its design echoes the title page he drew for a 1613 book on optics.', 'Given to the museum in 1894 by a group of Cologne art lovers; the original patron is not known.'],
      subj: 'Hera (Roman Juno) is queen of the gods and goddess of marriage. She set hundred-eyed Argus to guard Io, one of Zeus’s loves; when Hermes killed him, she placed his eyes on her sacred bird, the peacock.' },
    { type: 'work', key: 'h1_poseidon', artist: 'Greek, sculptor unknown', title: 'Bronze God from Cape Artemision', date: 'c. 460 BCE', det: 'Bronze, 209 cm high · National Archaeological Museum, Athens',
      lead: 'One of the very few full-size Greek bronzes to survive, raised from the sea off northern Euboea. Most ancient bronzes were melted down; this one lasted because it sank.',
      bul: ['Fishermen netted an arm around 1926; the nearly complete statue was brought up in September 1928.', 'The museum groups it with bronzes lost when Roman ships carrying art from Greece were wrecked.', 'Look at the arms: stretched to balance a throw, with a span (210 cm) slightly wider than the figure is tall.', 'The weapon in the right hand is lost, so it may be Zeus with a thunderbolt or Poseidon with a trident.'],
      subj: 'Poseidon (Roman Neptune), brother of Zeus, rules the sea, earthquakes and horses.' },
    { type: 'work', key: 'h6_varvakeion', artist: 'Roman, after Pheidias', title: 'Varvakeion Athena', date: '200–250 CE', det: 'Marble with traces of paint, about 1 m high · National Archaeological Museum, Athens',
      lead: 'A small copy of the most famous statue in Athens, the gold-and-ivory Athena Parthenos, which stood about 12 m high inside the Parthenon. The original is lost, so copies like this are the best evidence of how it looked.',
      bul: ['Found in Athens near the Varvakeion, in the ruins of a Roman house.', 'Traces of paint stood in for the gold and ivory of the original.', 'Its details match the ancient description by Pausanias: Victory in one hand, a shield at her feet and a serpent beside it.', 'Cambridge’s cast collection describes such statuettes as souvenirs of the famous original.'],
      subj: 'Athena (Roman Minerva) is goddess of wisdom, crafts and strategic war, born fully armed from Zeus’s head. Athens, her city, built the Parthenon in her honour.' },
    { type: 'work', key: 'h1_athena', artist: 'Andrea Mantegna', title: 'Minerva Expelling the Vices from the Garden of Virtue', date: 'completed 1502', det: 'Tempera on canvas, 160 × 192 cm · Louvre, Paris',
      lead: 'Made for Isabella d’Este’s studiolo in Mantua, a small private study she filled with paintings on moral themes.',
      bul: ['One of five canvases for the room; it hung opposite his Parnassus.', 'Look for the Vices in flight, among them armless Sloth and Ignorance carried by Ingratitude.', 'Hidden images: a tree in human form and a face in a cloud.', 'Inscriptions in several alphabets label the figures.', 'Later owned by Cardinal Richelieu; entered the French state collections in 1801.'],
      subj: 'Minerva was a natural champion of virtue over vice. Here the myth is used as a moral lesson rather than a story.' },
    { type: 'work', key: 'h1_apollo', artist: 'Roman, after a Greek bronze', title: 'Apollo Belvedere', date: 'early 2nd century CE', det: 'Marble · Vatican Museums, Vatican City',
      lead: 'The original dates from about 330 BCE and was probably by Leochares. Found in Rome in 1489, it became for three centuries the model of ideal male beauty.',
      bul: ['Cardinal Giuliano della Rovere owned it and, as Pope Julius II, set it in the Vatican’s Belvedere court by 1508.', 'Montorsoli rebuilt the missing arm and hand in 1532–33; the left hand is now a cast of an ancient fragment found at Baia.', 'Look at the pose: the god has just loosed an arrow; the bow in his left hand is lost.', 'Taken to Paris under Napoleon and returned in 1816.'],
      subj: 'Apollo, son of Zeus, is god of light, music, prophecy and archery. He is always young and beardless, often with bow, lyre or laurel.',
      terms: [['Chlamys', 'A short cloak pinned at the shoulder, here hanging from Apollo’s arm.']] },
    { type: 'work', key: 'h1_artemis', artist: 'Johannes Vermeer', title: 'Diana and Her Nymphs', date: 'c. 1653–54', det: 'Oil on canvas, 97.8 × 104.6 cm · Mauritshuis, The Hague',
      lead: 'One of the artist’s earliest paintings, made just after he joined the Delft painters’ guild and years before his quiet interiors.',
      bul: ['Long sold as a work by Nicolaes Maes; in 1885 the “N.M.” monogram proved a forgery over Vermeer’s signature.', 'Look for the small crescent moon on Diana’s head and a nymph washing her feet.', 'A later blue sky was covered in 1999–2000 to bring back the night setting.', 'The canvas was cut down on the right, cropping the kneeling figure at the edge.'],
      subj: 'Artemis (Roman Diana), Apollo’s twin, is goddess of the hunt, wild places and the moon, and a virgin protector of young women.' },
    { type: 'work', key: 'h1_ares', artist: 'Diego Velázquez', title: 'Mars', date: 'c. 1638', det: 'Oil on canvas, 179 × 95 cm · Museo del Prado, Madrid',
      lead: 'The painter turns the god of war into a weary man sitting on a bed, naked except for his helmet. The painting was recorded in Philip IV’s hunting lodge, the Torre de la Parada.',
      bul: ['Recorded there in 1701–03, beside his Aesop and Menippus of similar size.', 'Look for armour, shield and sword dropped at the foot of the bed and the baton resting on the floor.', 'The museum traces the pose to the ancient Ludovisi Ares and to Michelangelo’s Pensieroso.', 'Loose brushwork builds the body with soft outlines.'],
      subj: 'Ares (Roman Mars) is the god of war, admired by the Romans more than the Greeks.' },
    { type: 'work', key: 'h1_aphrodite', artist: 'Sandro Botticelli', title: 'The Birth of Venus', date: 'c. 1485', det: 'Tempera on canvas, 172.5 × 278.5 cm · Uffizi Gallery, Florence',
      lead: 'One of the first large paintings of a pagan goddess since antiquity, very probably made for a member of the Medici family. It is painted on canvas, a support then used for decoration in great houses.',
      bul: ['First recorded in 1550 by Vasari at the Medici villa of Castello.', 'Venus’s pose comes from ancient statues; gold highlights run through her hair.', 'The two winds at left are modelled on an ancient gem owned by Lorenzo the Magnificent.', 'Orange trees, a Medici emblem, and roses blown on the wind.', 'The cloaked woman is sometimes identified as the Hora of spring or one of the Graces.'],
      subj: 'Aphrodite (Roman Venus) is the goddess of love and beauty. In Hesiod she rises full-grown from the sea foam and comes ashore on Cyprus.' },
    { type: 'work', key: 'h1_hephaestus', artist: 'Diego Velázquez', title: 'Vulcan’s Forge', date: '1630', det: 'Oil on canvas, 223 × 290 cm · Museo del Prado, Madrid',
      lead: 'Painted in Rome during the painter’s first Italian trip, without a commission, then sold by the artist to Philip IV in 1634.',
      bul: ['Apollo, in orange with a laurel wreath and a halo of light, tells Vulcan that his wife Venus is Mars’s lover.', 'The armour on the anvil is being made for Mars.', 'Look at whole bodies freezing mid-movement, not only faces, to show the shock.', 'His first large work on a lead-white ground, giving it a lighter tone.'],
      subj: 'Hephaestus (Roman Vulcan) is the lame smith god, maker of the gods’ weapons. Apollo is the god who sees everything.' },
    { type: 'work', key: 'h1_hermes', artist: 'Attributed to Praxiteles', title: 'Hermes and the Infant Dionysus', date: '4th century BCE or later (disputed)', det: 'Parian marble, about 2.1 m high · Archaeological Museum of Olympia',
      lead: 'Found in 1877 in the Temple of Hera at Olympia, where the ancient travel writer Pausanias recorded a Hermes by Praxiteles. Whether this is that original, a later work or a copy is still debated.',
      bul: ['Excavated in May 1877; the right foot turned up in later digs.', 'Pausanias is the only ancient source to mention it.', 'The baby sits on his left arm; the lost right hand probably dangled grapes.', 'Proposed dates run from the mid-4th century BCE to about 100 BCE.'],
      subj: 'Hermes (Roman Mercury) is the messenger god and guide of travellers. Zeus gave him the infant Dionysus to carry to safety, away from Hera’s jealousy.' }
  ]
});
