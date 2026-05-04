import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine } from 'recharts';
import { Brain, Activity, AlertTriangle, TrendingUp, Zap, Target, Play, Pause, RotateCw } from 'lucide-react';

interface LSTMPrediction {
  timestamp: number;
  actualValue: number;
  predictedValue: number;
  anomalyScore: number;
  isAnomaly: boolean;
  confidence: number;
  features: number[];
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mse: number;
  mae: number;
  threshold: number;
  trainingLoss: number;
  validationLoss: number;
}

interface LSTMModel {
  id: string;
  name: string;
  status: 'training' | 'ready' | 'predicting' | 'error';
  architecture: {
    inputSize: number;
    hiddenLayers: number[];
    outputSize: number;
    sequenceLength: number;
    dropout: number;
  };
  metrics: ModelMetrics;
  lastTrained: Date;
  predictions: LSTMPrediction[];
}

interface TrainingData {
  epoch: number;
  trainingLoss: number;
  validationLoss: number;
  accuracy: number;
}

export function LSTMAnomalyDetection() {
  const [models, setModels] = useState<LSTMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<LSTMModel | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [realTimePredictions, setRealTimePredictions] = useState<LSTMPrediction[]>([]);
  const [anomaliesDetected, setAnomaliesDetected] = useState(0);
  const [predictionMode, setPredictionMode] = useState<'paused' | 'running'>('running');

  // Initialize LSTM models
  useEffect(() => {
    const initialModels: LSTMModel[] = [
      {
        id: 'lstm_network_traffic',
        name: 'Network Traffic LSTM',
        status: 'ready',
        architecture: {
          inputSize: 83, // CIC-IDS features
          hiddenLayers: [128, 64, 32],
          outputSize: 1,
          sequenceLength: 10,
          dropout: 0.2
        },
        metrics: {
          accuracy: 94.7,
          precision: 92.3,
          recall: 96.1,
          f1Score: 94.2,
          mse: 0.023,
          mae: 0.087,
          threshold: 0.65,
          trainingLoss: 0.045,
          validationLoss: 0.052
        },
        lastTrained: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        predictions: []
      },
      {
        id: 'lstm_behavioral',
        name: 'Behavioral Anomaly LSTM',
        status: 'ready',
        architecture: {
          inputSize: 50,
          hiddenLayers: [100, 50, 25],
          outputSize: 1,
          sequenceLength: 15,
          dropout: 0.3
        },
        metrics: {
          accuracy: 91.4,
          precision: 89.7,
          recall: 93.2,
          f1Score: 91.4,
          mse: 0.034,
          mae: 0.112,
          threshold: 0.7,
          trainingLoss: 0.056,
          validationLoss: 0.061
        },
        lastTrained: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        predictions: []
      },
      {
        id: 'lstm_protocol',
        name: 'Protocol Analysis LSTM',
        status: 'training',
        architecture: {
          inputSize: 25,
          hiddenLayers: [64, 32],
          outputSize: 1,
          sequenceLength: 8,
          dropout: 0.15
        },
        metrics: {
          accuracy: 87.2,
          precision: 85.1,
          recall: 89.3,
          f1Score: 87.1,
          mse: 0.045,
          mae: 0.134,
          threshold: 0.6,
          trainingLoss: 0.078,
          validationLoss: 0.082
        },
        lastTrained: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        predictions: []
      }
    ];

    setModels(initialModels);
    setSelectedModel(initialModels[0]);

    // Generate training data
    const trainingHistory: TrainingData[] = [];
    for (let epoch = 1; epoch <= 50; epoch++) {
      trainingHistory.push({
        epoch,
        trainingLoss: 0.8 * Math.exp(-epoch * 0.1) + Math.random() * 0.02,
        validationLoss: 0.85 * Math.exp(-epoch * 0.095) + Math.random() * 0.025,
        accuracy: Math.min(98, 60 + (epoch * 0.8) + Math.random() * 2)
      });
    }
    setTrainingData(trainingHistory);
  }, []);

  // Generate real-time predictions
  useEffect(() => {
    if (predictionMode === 'paused') return;

    const interval = setInterval(() => {
      const model = selectedModel;
      if (!model || model.status !== 'ready') return;

      // Generate new prediction
      const actualValue = Math.sin(Date.now() / 10000) + Math.random() * 0.5;
      const basePredict = actualValue + (Math.random() - 0.5) * 0.2;
      
      // Occasionally generate anomalies
      const isAnomaly = Math.random() > 0.85;
      const predictedValue = isAnomaly ? actualValue + (Math.random() - 0.5) * 2 : basePredict;
      const anomalyScore = Math.abs(actualValue - predictedValue);
      
      const prediction: LSTMPrediction = {
        timestamp: Date.now(),
        actualValue,
        predictedValue,
        anomalyScore,
        isAnomaly: anomalyScore > model.metrics.threshold,
        confidence: Math.max(0.1, 1 - anomalyScore),
        features: Array.from({ length: model.architecture.inputSize }, () => Math.random())
      };

      setRealTimePredictions(prev => [prediction, ...prev.slice(0, 49)]);
      
      if (prediction.isAnomaly) {
        setAnomaliesDetected(prev => prev + 1);
      }

      // Update model predictions
      setModels(prev => prev.map(m => 
        m.id === model.id 
          ? { ...m, predictions: [prediction, ...m.predictions.slice(0, 99)] }
          : m
      ));
    }, 1500);

    return () => clearInterval(interval);
  }, [selectedModel, predictionMode]);

  // Simulate model training
  const trainModel = (modelId: string) => {
    setIsTraining(true);
    setModels(prev => prev.map(m => 
      m.id === modelId ? { ...m, status: 'training' } : m
    ));

    // Simulate training process
    let epoch = 0;
    const trainingInterval = setInterval(() => {
      epoch++;
      const trainingLoss = 0.8 * Math.exp(-epoch * 0.1) + Math.random() * 0.02;
      const validationLoss = 0.85 * Math.exp(-epoch * 0.095) + Math.random() * 0.025;
      const accuracy = Math.min(98, 60 + (epoch * 0.8) + Math.random() * 2);

      setTrainingData(prev => [...prev, {
        epoch: prev.length + 1,
        trainingLoss,
        validationLoss,
        accuracy
      }]);

      if (epoch >= 10) { // Shorter training for demo
        clearInterval(trainingInterval);
        setIsTraining(false);
        
        setModels(prev => prev.map(m => 
          m.id === modelId 
            ? { 
                ...m, 
                status: 'ready',
                lastTrained: new Date(),
                metrics: {
                  ...m.metrics,
                  accuracy: accuracy,
                  trainingLoss,
                  validationLoss
                }
              } 
            : m
        ));
      }
    }, 500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-600 text-white';
      case 'training': return 'bg-blue-600 text-white animate-pulse';
      case 'predicting': return 'bg-yellow-600 text-black';
      case 'error': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getAnomalyColor = (isAnomaly: boolean, score: number) => {
    if (isAnomaly) return 'text-red-400';
    if (score > 0.4) return 'text-yellow-400';
    return 'text-green-400';
  };

  // Prepare chart data
  const predictionChartData = realTimePredictions.slice(0, 30).reverse().map((pred, index) => ({
    time: index,
    actual: pred.actualValue,
    predicted: pred.predictedValue,
    anomalyScore: pred.anomalyScore,
    isAnomaly: pred.isAnomaly
  }));

  const recentAnomalies = realTimePredictions.filter(p => p.isAnomaly).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-900 to-indigo-800 border-indigo-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-100">Active Models</CardTitle>
            <Brain className="h-4 w-4 text-indigo-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{models.filter(m => m.status === 'ready').length}</div>
            <p className="text-xs text-indigo-200">of {models.length} total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-900 to-emerald-800 border-emerald-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100">Predictions/min</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{Math.round(60 / 1.5)}</div>
            <p className="text-xs text-emerald-200">real-time inference</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900 to-red-800 border-red-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-100">Anomalies Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{anomaliesDetected}</div>
            <p className="text-xs text-red-200">this session</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-900 to-amber-800 border-amber-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-100">Avg Accuracy</CardTitle>
            <Target className="h-4 w-4 text-amber-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {(models.reduce((acc, m) => acc + m.metrics.accuracy, 0) / models.length).toFixed(1)}%
            </div>
            <p className="text-xs text-amber-200">across all models</p>
          </CardContent>
        </Card>
      </div>

      {/* Model Selection and Controls */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-400" />
              LSTM Model Management
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={predictionMode === 'running' ? 'default' : 'secondary'}
                onClick={() => setPredictionMode(predictionMode === 'running' ? 'paused' : 'running')}
              >
                {predictionMode === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {predictionMode === 'running' ? 'Pause' : 'Resume'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRealTimePredictions([]);
                  setAnomaliesDetected(0);
                }}
              >
                <RotateCw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <div
                key={model.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedModel?.id === model.id 
                    ? 'border-blue-500 bg-blue-950/20' 
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
                onClick={() => setSelectedModel(model)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{model.name}</h4>
                  <Badge className={getStatusColor(model.status)}>
                    {model.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Accuracy:</span>
                    <span className="text-green-400">{model.metrics.accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">F1 Score:</span>
                    <span className="text-blue-400">{model.metrics.f1Score.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">MSE:</span>
                    <span className="text-yellow-400">{model.metrics.mse.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Predictions:</span>
                    <span className="text-purple-400">{model.predictions.length}</span>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      trainModel(model.id);
                    }}
                    disabled={model.status === 'training' || isTraining}
                  >
                    {model.status === 'training' ? 'Training...' : 'Retrain'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              Real-time Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={predictionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Actual"
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Predicted"
                />
                <Line 
                  type="monotone" 
                  dataKey="anomalyScore" 
                  stroke="#EF4444" 
                  strokeWidth={1}
                  name="Anomaly Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Training Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trainingData.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="epoch" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="trainingLoss" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  name="Training Loss"
                />
                <Line 
                  type="monotone" 
                  dataKey="validationLoss" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Validation Loss"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Model Architecture and Recent Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedModel && (
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle>Model Architecture - {selectedModel.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-blue-400">Network Structure</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Input Size:</span>
                      <span className="text-cyan-400">{selectedModel.architecture.inputSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hidden Layers:</span>
                      <span className="text-cyan-400">[{selectedModel.architecture.hiddenLayers.join(', ')}]</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Output Size:</span>
                      <span className="text-cyan-400">{selectedModel.architecture.outputSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sequence Length:</span>
                      <span className="text-cyan-400">{selectedModel.architecture.sequenceLength}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dropout:</span>
                      <span className="text-cyan-400">{selectedModel.architecture.dropout}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-green-400">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Accuracy</span>
                        <span>{selectedModel.metrics.accuracy.toFixed(1)}%</span>
                      </div>
                      <Progress value={selectedModel.metrics.accuracy} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Precision</span>
                        <span>{selectedModel.metrics.precision.toFixed(1)}%</span>
                      </div>
                      <Progress value={selectedModel.metrics.precision} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Recall</span>
                        <span>{selectedModel.metrics.recall.toFixed(1)}%</span>
                      </div>
                      <Progress value={selectedModel.metrics.recall} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Recent Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {recentAnomalies.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    No anomalies detected
                  </div>
                ) : (
                  recentAnomalies.map((anomaly, index) => (
                    <div key={index} className="bg-slate-800 p-3 rounded-lg border border-red-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-red-600 text-white">ANOMALY</Badge>
                        <span className="text-xs text-slate-400">
                          {new Date(anomaly.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-400">Score:</span>
                          <div className={`font-medium ${getAnomalyColor(anomaly.isAnomaly, anomaly.anomalyScore)}`}>
                            {anomaly.anomalyScore.toFixed(3)}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">Confidence:</span>
                          <div className="font-medium text-yellow-400">
                            {(anomaly.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">Actual:</span>
                          <div className="font-medium text-green-400">
                            {anomaly.actualValue.toFixed(3)}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">Predicted:</span>
                          <div className="font-medium text-blue-400">
                            {anomaly.predictedValue.toFixed(3)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}