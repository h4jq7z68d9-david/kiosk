/* TEST FIXTURE ONLY (tools/study/test-technique-slides.js). Never installed, published, linked or in the sitemap;
   the deploy excludes tools/study/fixtures/. Placeholder text to exercise the technique slide model:
   one topen and one concept with an example painting. Images (img/) and credits.js live in this fixture folder
   (copied from Color Theory on Nov 11 2026) so a Color Theory rebuild cannot break the tests. */
window.SITE = {
  title: 'Technique slide fixture',
  sections: { 1: 'Fixture section' },
  handouts: [
    {
      n: 1, wk: 1, title: 'Fixture part',
      slides: [
        {
          type: 'topen',
          title: 'Fixture opening slide',
          para: 'Placeholder history line for the opening slide. A second short line checks the paragraph wraps.',
          img: 'chevreul-chromatic-circle',
          alt: 'Engraved color circle with numbered segments',
          credit: 'Public domain (faithful reproduction of a public-domain 2D work)'
        },
        {
          type: 'concept',
          title: 'Fixture concept',
          img: 'chevreul-1890-plate-ii',
          alt: 'Three red disks on purple, yellow and gray grounds',
          stmt: 'Placeholder one-sentence definition of the concept.',
          look: [
            'Placeholder bullet one about the plate.',
            'Placeholder bullet two about the plate.',
            'Placeholder bullet three about the plate.'
          ],
          ex: {
            key: 'vangogh-night-cafe',
            artist: 'Vincent van Gogh',
            title: 'The Night Café',
            date: '1888',
            det: 'Oil on canvas · 28½ × 36¼ in. · Yale University Art Gallery',
            alt: 'Café interior with a billiard table under lamps, red walls and a green ceiling',
            line: 'Placeholder line on how the example painting shows the concept.'
          },
          bul: 'Placeholder closing line.'
        }
      ]
    }
  ]
};
