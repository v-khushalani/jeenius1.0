import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  BookOpen, 
  Clock, 
  Target, 
  ChevronRight, 
  Play, 
  CheckCircle, 
  Star,
  TrendingUp,
  Brain,
  Users,
  Award
} from 'lucide-react';
import { jeeData, type ClassData, type Subject, type Chapter, type Topic } from '@/data/jeeData';

const JEELessons = () => {
  const [selectedClass, setSelectedClass] = useState<11 | 12>(11);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const currentClassData = jeeData.find(data => data.class === selectedClass);
  const currentSubject = currentClassData?.subjects.find(s => s.id === selectedSubject);
  const currentChapter = currentSubject?.chapters.find(c => c.id === selectedChapter);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSubjectColor = (color: string) => {
    return color;
  };

  // Topic Detail View
  if (selectedTopic) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <button 
            onClick={() => setSelectedTopic(null)}
            className="hover:text-primary"
          >
            Class {selectedClass}
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-primary font-medium">{selectedTopic.name}</span>
        </div>

        {/* Topic Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{selectedTopic.name}</CardTitle>
                <p className="text-muted-foreground">{selectedTopic.description}</p>
                <div className="flex items-center space-x-4">
                  <Badge className={getDifficultyColor(selectedTopic.difficulty)}>
                    {selectedTopic.difficulty}
                  </Badge>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{selectedTopic.estimatedTime}</span>
                  </div>
                </div>
              </div>
              <Button size="lg" className="bg-primary">
                <Play className="w-4 h-4 mr-2" />
                Start Learning
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Topic Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Concepts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-primary" />
                <span>Key Concepts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {selectedTopic.concepts.map((concept, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Formulas */}
          {selectedTopic.keyFormulas && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span>Key Formulas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedTopic.keyFormulas.map((formula, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <code className="text-blue-800 font-mono">{formula}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Important Points */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <span>Important Points to Remember</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {selectedTopic.importantPoints.map((point, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold mt-0.5">
                    {index + 1}
                  </div>
                  <span className="flex-1">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setSelectedTopic(null)}>
            Back to Chapters
          </Button>
          <div className="space-x-3">
            <Button variant="outline">
              Practice Questions
            </Button>
            <Button className="bg-primary">
              Take Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">JEE Complete Course</h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive chapter-wise and topic-wise lessons for Physics, Chemistry & Mathematics
        </p>
      </div>

      {/* Class Selection */}
      <Tabs value={selectedClass.toString()} onValueChange={(value) => {
        setSelectedClass(parseInt(value) as 11 | 12);
        setSelectedSubject('');
        setSelectedChapter('');
      }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="11">Class 11</TabsTrigger>
          <TabsTrigger value="12">Class 12</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedClass.toString()} className="space-y-6">
          {/* Stats Dashboard */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">
                  {currentClassData?.subjects.reduce((acc, s) => acc + s.chapters.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Chapters</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">
                  {currentClassData?.subjects.reduce((acc, s) => 
                    acc + s.chapters.reduce((chAcc, ch) => chAcc + ch.topics.length, 0), 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Topics</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">85%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold">50K+</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Selection */}
          {!selectedSubject && (
            <div className="grid md:grid-cols-3 gap-6">
              {currentClassData?.subjects.map((subject) => (
                <Card key={subject.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg ${getSubjectColor(subject.color)} flex items-center justify-center text-white text-2xl`}>
                          {subject.icon}
                        </div>
                        <div>
                          <CardTitle>{subject.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {subject.chapters.length} chapters
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      onClick={() => setSelectedSubject(subject.id)}
                    >
                      Explore Chapters
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Chapter Selection */}
          {selectedSubject && !selectedChapter && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <span className="text-2xl">{currentSubject?.icon}</span>
                  <span>{currentSubject?.name} - Class {selectedClass}</span>
                </h2>
                <Button variant="outline" onClick={() => setSelectedSubject('')}>
                  Back to Subjects
                </Button>
              </div>
              
              <div className="grid gap-4">
                {currentSubject?.chapters.map((chapter, index) => (
                  <Card key={chapter.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                              {index + 1}
                            </div>
                            <CardTitle>{chapter.name}</CardTitle>
                          </div>
                          <p className="text-muted-foreground">{chapter.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <BookOpen className="w-4 h-4" />
                              <span>{chapter.totalTopics} topics</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{chapter.estimatedDuration}</span>
                            </div>
                          </div>
                        </div>
                        <Button onClick={() => setSelectedChapter(chapter.id)}>
                          View Topics
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Topic Selection */}
          {selectedChapter && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{currentChapter?.name}</h2>
                <Button variant="outline" onClick={() => setSelectedChapter('')}>
                  Back to Chapters
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Chapter Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>{currentChapter?.description}</p>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span>{currentChapter?.totalTopics} topics</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{currentChapter?.estimatedDuration}</span>
                      </div>
                    </div>
                    <Progress value={30} className="h-2" />
                    <p className="text-sm text-muted-foreground">Progress: 3 of 10 topics completed</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-3">
                {currentChapter?.topics.map((topic, index) => (
                  <Card key={topic.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-semibold">{topic.name}</h3>
                            <p className="text-sm text-muted-foreground">{topic.description}</p>
                            <div className="flex items-center space-x-4">
                              <Badge className={getDifficultyColor(topic.difficulty)}>
                                {topic.difficulty}
                              </Badge>
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{topic.estimatedTime}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => setSelectedTopic(topic)}
                        >
                          Study
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JEELessons;