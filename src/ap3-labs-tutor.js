function describeTable({ caption, headers, rows }) {
  return caption + '. ' + headers.join(' | ') + '. ' + rows.map(row => row.join(' | ')).join('. ');
}

function routeContext(activity, state) {
  const route = activity.routes[state.route];
  const complete = state.step === route.steps.length;
  const confirmed = route.steps.slice(0, state.step + Number(state.routeCorrect)).map(step => step[0]);
  const location = confirmed.at(-1) || route.start;
  const step = route.steps[state.step];
  const prediction = step && state.routeChoice !== null ? step[state.routeChoice] : '';
  const facts = [activity.intro, 'Starting point: ' + route.start];
  if (confirmed.length) facts.push('Confirmed stops in order: ' + confirmed.join(' → ') + '.');
  if (state.routeCorrect) facts.push(step[3]);
  if (prediction && !state.routeCorrect) facts.push('The selected stop did not match the route. Another attempt is available.');
  let question = 'From ' + location + ', which stop comes next?';
  if (complete) question = 'How does material travel from the starting point to the final confirmed stop?';
  else if (state.routeCorrect) question = 'What explains the connection you just confirmed?';
  return {
    state: {
      route: route.label,
      progress: complete ? 'Route complete' : 'Step ' + (state.step + 1) + ' of ' + route.steps.length,
      location,
      status: complete ? 'Complete' : state.routeCorrect ? 'Step confirmed' : prediction ? 'Retry current step' : 'Awaiting next stop',
    },
    question, prediction, facts,
    hint: 'Identify the compartment you are in and which direction the material is traveling.',
    answer: state.routeCorrect ? step[3] : complete ? [route.start, ...confirmed].join(' → ') : '',
  };
}

function experimentContext(activity, state) {
  const data = activity.run(state.values);
  const settings = Object.fromEntries(activity.controls.map(control => {
    const value = state.values[control.key];
    return [control.label, control.labels ? control.labels[value] : value + ' ' + control.unit];
  }));
  const submitted = state.choice !== null;
  const facts = [activity.intro, describeTable(data.observation)];
  if (data.media) facts.push(data.media.description);
  if (data.note) facts.push(data.note);
  const prediction = submitted ? data.choices[state.choice] : '';
  let answer = '';
  if (submitted) {
    const [label, detail] = data.frames[state.frame];
    settings['Selected result frame'] = label;
    answer = 'Expected prediction: ' + data.choices[0] + '. ' + data.why;
    facts.push(answer, 'Current frame: ' + label + '. ' + detail);
    if (data.result) facts.push(describeTable(data.result));
  }
  return {
    state: { ...settings, status: submitted ? 'Prediction checked' : 'Awaiting prediction' },
    question: data.question, prediction, facts, answer,
    hint: 'Use the observed values and units. Identify the change to compare and what stays fixed.',
  };
}

// Publish the same evidence a learner can inspect at this instant. Routes and
// datasets retain their answer keys and unrevealed frames inside the lab.
export function springLabTutorContext(chapterId, activity, state) {
  const snapshot = activity.routes ? routeContext(activity, state) : experimentContext(activity, state);
  return {
    course: 'ap3', type: 'diagram', reference: activity.section, label: activity.title,
    text: snapshot.facts.join(' '),
    diagram: { id: 'ap3-lab-' + chapterId + '-' + state.activityIndex, ...snapshot },
  };
}
