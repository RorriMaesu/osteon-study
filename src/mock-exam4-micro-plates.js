export const mockExam4MicroPlates = {
  coverings: {
    figure: '10.3',
    bounds: [90, 70, 1010, 428],
    label: 'Skeletal muscle cutaway with a bundle of fibers pulled out. Three numbers mark connective tissue layers.',
    // Trim the original callout lines where they extend into the white margin.
    masks: [
      [267, 70, 36, 84],
      [472, 70, 200, 33],
      [464, 102, 53, 7],
      [658, 102, 7, 8],
      [1036, 352, 64, 80],
    ],
    markers: [
      { number: 1, point: [650, 114], term: 'Epimysium' },
      { number: 2, point: [1026, 350], term: 'Perimysium' },
      { number: 3, point: [918, 271], term: 'Endomysium' },
    ],
  },
  sarcomere: {
    figure: '10.10',
    bounds: [185, 46, 1280, 480],
    label: 'A relaxed sarcomere with three numbered markers on the illustrated structures.',
    masks: [],
    markers: [
      { number: 1, point: [247, 159], term: 'Z disc' },
      { number: 2, point: [816, 353], term: 'M line' },
      { number: 3, point: [1035, 422], term: 'Thick filament' },
    ],
  },
};
