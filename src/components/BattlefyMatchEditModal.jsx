import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Trophy } from 'lucide-react';

const BattlefyMatchEditModal = ({ match, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    scheduledDate: '',
    status: 'scheduled',
    result: {
      team1Score: 0,
      team2Score: 0,
      winner: null
    }
  });

  useEffect(() => {
    if (match) {
      setFormData({
        scheduledDate: match.scheduledDate ? new Date(match.scheduledDate).toISOString().slice(0, 16) : '',
        status: match.status || 'scheduled',
        result: {
          team1Score: match.result?.team1Score || 0,
          team2Score: match.result?.team2Score || 0,
          winner: match.result?.winner || null
        }
      });
    }
  }, [match]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const updatedMatch = {
      ...match,
      scheduledDate: formData.scheduledDate,
      status: formData.status,
      result: formData.result
    };

    onSave(updatedMatch);
    onClose();
  };

  const handleScoreChange = (team, score) => {
    const newScore = Math.max(0, parseInt(score) || 0);
    setFormData(prev => ({
      ...prev,
      result: {
        ...prev.result,
        [`${team}Score`]: newScore,
        winner: newScore > prev.result[team === 'team1' ? 'team2Score' : 'team1Score'] ? team : 
                newScore < prev.result[team === 'team1' ? 'team2Score' : 'team1Score'] ? (team === 'team1' ? 'team2' : 'team1') : null
      }
    }));
  };

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Editar Partida Battlefy
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações não editáveis */}
          <div className="bg-gray-700 p-3 rounded-lg">
            <p className="text-sm text-gray-300 mb-1">Torneio:</p>
            <p className="text-white font-medium">{match.tournamentName}</p>
            <div className="flex justify-between mt-2">
              <div>
                <p className="text-sm text-gray-300">Time 1:</p>
                <p className="text-white">{match.team1?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-300">Time 2:</p>
                <p className="text-white">{match.team2?.name}</p>
              </div>
            </div>
          </div>

          {/* Data agendada */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data e Hora Agendada
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledDate}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status da Partida
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="scheduled">Agendada</option>
              <option value="live">Ao Vivo</option>
              <option value="finished">Finalizada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          {/* Resultado */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Resultado da Partida
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">{match.team1?.name}</label>
                <input
                  type="number"
                  min="0"
                  value={formData.result.team1Score}
                  onChange={(e) => handleScoreChange('team1', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-gray-400 font-bold">VS</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">{match.team2?.name}</label>
                <input
                  type="number"
                  min="0"
                  value={formData.result.team2Score}
                  onChange={(e) => handleScoreChange('team2', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {formData.result.winner && (
              <p className="text-sm text-green-400 mt-2 text-center">
                Vencedor: {formData.result.winner === 'team1' ? match.team1?.name : match.team2?.name}
              </p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BattlefyMatchEditModal;