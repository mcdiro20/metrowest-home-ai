import React, { useState, useEffect } from 'react';
import { Mail, Users, Download, Eye, Calendar } from 'lucide-react';
import { EmailService } from '../services/emailService';

const AdminPanel: React.FC = () => {
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  useEffect(() => {
    // Load sent emails and subscribers
    setSentEmails(EmailService.getSentEmails());
    setSubscribers(JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]'));
  }, []);

  const downloadEmailData = () => {
    const data = {
      sentEmails,
      subscribers,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrowest-home-ai-emails-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const viewEmailPreview = (email: any) => {
    setSelectedEmail(email);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MetroWest Home AI - Admin Panel
          </h1>
          <p className="text-gray-600">
            Manage emails and subscriber data
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{sentEmails.length}</h3>
                <p className="text-gray-600">Emails Sent</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{subscribers.length}</h3>
                <p className="text-gray-600">Newsletter Subscribers</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {sentEmails.filter(email => {
                    const sentDate = new Date(email.sentAt);
                    const today = new Date();
                    return sentDate.toDateString() === today.toDateString();
                  }).length}
                </h3>
                <p className="text-gray-600">Today's Emails</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex gap-4">
            <button
              onClick={downloadEmailData}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>

        {/* Sent Emails Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Sent Emails</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Style
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscribed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sentEmails.map((email) => (
                  <tr key={email.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {email.recipient}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {email.roomType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {email.selectedStyle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(email.sentAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        email.subscribe 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {email.subscribe ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewEmailPreview(email)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Email Preview Modal */}
        {selectedEmail && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-semibold">Email Preview</h3>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Before</h4>
                    <img 
                      src={selectedEmail.beforeImageUrl} 
                      alt="Before" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">After (AI Generated)</h4>
                    <img 
                      src={selectedEmail.afterImageUrl} 
                      alt="After" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Recipient:</strong> {selectedEmail.recipient}</p>
                  <p><strong>Style:</strong> {selectedEmail.selectedStyle}</p>
                  <p><strong>Room Type:</strong> {selectedEmail.roomType}</p>
                  <p><strong>Sent:</strong> {new Date(selectedEmail.sentAt).toLocaleString()}</p>
                  <p><strong>Newsletter Subscription:</strong> {selectedEmail.subscribe ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;