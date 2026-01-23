import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await resetPassword(email);
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
      setIsLoading(false);
    } else {
      setEmailSent(true);
      toast({
        title: "Email Sent! 📧",
        description: "Check your inbox for password reset instructions",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="min-h-screen flex items-center justify-center pt-20 pb-8 px-4">
        <Card className="w-full max-w-md border-[#e9e9e9] shadow-xl">
          <CardHeader className="text-center space-y-2 pb-8">
            <CardTitle className="text-3xl font-bold text-[#013062]">
              Forgot Password?
            </CardTitle>
            <p className="text-[#013062]/60">
              {emailSent 
                ? "We've sent you a reset link" 
                : "Enter your email to reset your password"}
            </p>
          </CardHeader>
          
          <CardContent>
            {!emailSent ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#013062]">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#013062]/40" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-[#e9e9e9] focus:border-[#013062]"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#013062] hover:bg-[#013062]/90 text-white py-6 text-lg font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-[#013062]/80">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-[#013062]/60">
                  Please check your inbox and follow the instructions to reset your password.
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full bg-[#013062] hover:bg-[#013062]/90 text-white py-6 text-lg font-semibold mt-4"
                >
                  Back to Login
                </Button>
              </div>
            )}

            {!emailSent && (
              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="text-[#013062] font-semibold hover:underline inline-flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
