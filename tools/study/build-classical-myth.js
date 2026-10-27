#!/usr/bin/env node
/* Kept so the old command still works. The generator is now general:
   node tools/study/build-course.js <course-slug>   (settings in tools/study/courses/<course-slug>.json) */
process.argv[2] = 'classical-myth';
require('./build-course.js');
