async function loadCSVData(url) {
  const response = await fetch(url);
  const csv = await response.text();
  const results = Papa.parse(csv, { header: true, dynamicTyping: true });
  const data = results.data;

  // Удаление второго столбца
  const columnIndexToRemove = 1;
  data.forEach(row => {
    const keys = Object.keys(row);
    delete row[keys[columnIndexToRemove]];
  });

  const inputs = data.map(d => Object.values(d).slice(0, -1));
  const labels = data.map(d => [Object.values(d).pop()]);

  return {
    inputs: tf.tensor2d(inputs),
    labels: tf.tensor2d(labels),
  };
}

function createModel() {
  const model = tf.sequential();

  model.add(tf.layers.dense({ inputShape: [5], units: 10, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: tf.losses.meanSquaredError,
    metrics: ['accuracy'],
  });

  return model;
}

async function trainModel(model, inputs, labels) {
  const batchSize = 32;
  const epochs = 100;

  return model.fit(inputs, labels, {
    batchSize,
    epochs,
    shuffle: true,
    verbose: 1,
  });
}

function predictAdmission(model, inputData) {
  const inputTensor = tf.tensor2d([inputData]);
  const outputTensor = model.predict(inputTensor);
  const probability = outputTensor.dataSync()[0];

  return probability;
}

async function main() {
  const url = 'training_data.csv';
  const { inputs, labels } = await loadCSVData(url);

  const model = createModel();
  await trainModel(model, inputs, labels);

  const predictButton = document.getElementById('predictButton');
  predictButton.addEventListener('click', () => {
    const inputOriginal = document.getElementById('orig').value;
    const inputExam1 = document.getElementById('ege1').value;
    const inputExam2 = document.getElementById('ege2').value;
    const inputExam3 = document.getElementById('ege3').value;
    const inputIndividualAchievements = document.getElementById('individ').value;

    const studentData = [
      Number(inputOriginal),
      Number(inputExam1),
      Number(inputExam2),
      Number(inputExam3),
      Number(inputIndividualAchievements),
    ];

    const probability = predictAdmission(model, studentData);
    const resultElement = document.getElementById('result');
    resultElement.textContent = `Вероятность поступления студента: ${(probability * 100).toFixed(2)}%`;
  });
}

main();
