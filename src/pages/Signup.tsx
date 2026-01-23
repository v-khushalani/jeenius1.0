import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { signUpWithEmail } = useAuth();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const result = await signUpWithEmail(email, password, fullName);
    
    if (result.error) {
      toast({
        title: "Signup Failed",
        description: result.error,
        variant: "destructive"
      });
      setIsLoading(false);
    } else {
      toast({
        title: "Account Created! 🎉",
        description: "Check your email to verify your account",
      });
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="min-h-screen flex items-center justify-center pt-20 pb-8 px-4">
        <Card className="w-full max-w-md border-[#e9e9e9] shadow-xl">
          <CardHeader className="text-center space-y-2 pb-8">
            <CardTitle className="text-3xl font-bold text-[#013062]">
              Create Account
            </CardTitle>
            <p className="text-[#013062]/60">Join 50,000+ students preparing for JEE & NEET</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[#013062]">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#013062]/40" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 border-[#e9e9e9] focus:border-[#013062]"
                    required
                  />
                </div>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#013062]">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#013062]/40" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-[#e9e9e9] focus:border-[#013062]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#013062]/40 hover:text-[#013062]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#013062]">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#013062]/40" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 border-[#e9e9e9] focus:border-[#013062]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#013062]/40 hover:text-[#013062]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#013062] hover:bg-[#013062]/90 text-white py-6 text-lg font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#013062]/60">
                Already have an account?{' '}
                <Link to="/login" className="text-[#013062] font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
