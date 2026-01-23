-- Add Biology chapters for NEET (Botany + Zoology combined as Biology)
INSERT INTO public.chapters (subject, chapter_name, chapter_number, description, difficulty_level, is_free, is_premium) VALUES
-- Class 11 Biology
('Biology', 'The Living World', 1, 'Characteristics of living organisms, biodiversity, taxonomy', 'easy', true, false),
('Biology', 'Biological Classification', 2, 'Five kingdom classification, viruses, viroids, lichens', 'easy', true, false),
('Biology', 'Plant Kingdom', 3, 'Algae, bryophytes, pteridophytes, gymnosperms, angiosperms', 'medium', true, false),
('Biology', 'Animal Kingdom', 4, 'Classification of animals, phyla characteristics', 'medium', true, false),
('Biology', 'Morphology of Flowering Plants', 5, 'Root, stem, leaf, flower, fruit, seed', 'easy', true, false),
('Biology', 'Anatomy of Flowering Plants', 6, 'Tissues, tissue systems, secondary growth', 'medium', true, false),
('Biology', 'Structural Organisation in Animals', 7, 'Animal tissues, organ systems', 'medium', true, false),
('Biology', 'Cell: The Unit of Life', 8, 'Cell structure, prokaryotic and eukaryotic cells, organelles', 'medium', true, false),
('Biology', 'Biomolecules', 9, 'Carbohydrates, proteins, lipids, nucleic acids, enzymes', 'hard', true, false),
('Biology', 'Cell Cycle and Cell Division', 10, 'Mitosis, meiosis, cell cycle regulation', 'hard', true, false),
('Biology', 'Transport in Plants', 11, 'Water absorption, transpiration, translocation', 'medium', true, false),
('Biology', 'Mineral Nutrition', 12, 'Essential minerals, deficiency symptoms, nitrogen metabolism', 'medium', true, false),
('Biology', 'Photosynthesis in Higher Plants', 13, 'Light and dark reactions, C3 and C4 pathways, photorespiration', 'hard', true, false),
('Biology', 'Respiration in Plants', 14, 'Glycolysis, Krebs cycle, ETC, fermentation', 'hard', true, false),
('Biology', 'Plant Growth and Development', 15, 'Growth regulators, photoperiodism, vernalization', 'medium', true, false),
('Biology', 'Digestion and Absorption', 16, 'Alimentary canal, digestive glands, digestion process', 'medium', true, false),
('Biology', 'Breathing and Exchange of Gases', 17, 'Respiratory organs, mechanism, transport of gases', 'medium', true, false),
('Biology', 'Body Fluids and Circulation', 18, 'Blood, heart, circulatory pathways, cardiac cycle', 'hard', true, false),
('Biology', 'Excretory Products and their Elimination', 19, 'Nephron, urine formation, regulation', 'hard', true, false),
('Biology', 'Locomotion and Movement', 20, 'Muscle types, skeletal system, joints', 'medium', true, false),
('Biology', 'Neural Control and Coordination', 21, 'Neurons, CNS, PNS, reflex action', 'hard', true, false),
('Biology', 'Chemical Coordination and Integration', 22, 'Endocrine glands, hormones, feedback mechanisms', 'hard', true, false),

-- Class 12 Biology
('Biology', 'Reproduction in Organisms', 23, 'Asexual and sexual reproduction modes', 'easy', true, false),
('Biology', 'Sexual Reproduction in Flowering Plants', 24, 'Flower structure, pollination, fertilization, embryo development', 'hard', true, false),
('Biology', 'Human Reproduction', 25, 'Male and female reproductive systems, gametogenesis, menstrual cycle', 'hard', true, false),
('Biology', 'Reproductive Health', 26, 'Contraception, STDs, infertility, ART', 'medium', true, false),
('Biology', 'Principles of Inheritance and Variation', 27, 'Mendel''s laws, chromosomal theory, linkage, mutations', 'hard', true, false),
('Biology', 'Molecular Basis of Inheritance', 28, 'DNA structure, replication, transcription, translation, genetic code', 'hard', true, false),
('Biology', 'Evolution', 29, 'Origin of life, theories, evidences, human evolution', 'medium', true, false),
('Biology', 'Human Health and Disease', 30, 'Pathogens, immunity, AIDS, cancer, drugs', 'medium', true, false),
('Biology', 'Strategies for Enhancement in Food Production', 31, 'Animal husbandry, plant breeding, tissue culture, SCP', 'easy', true, false),
('Biology', 'Microbes in Human Welfare', 32, 'Microbes in food, sewage, biogas, biocontrol', 'easy', true, false),
('Biology', 'Biotechnology: Principles and Processes', 33, 'Genetic engineering, PCR, gel electrophoresis, vectors', 'hard', true, false),
('Biology', 'Biotechnology and its Applications', 34, 'GMOs, gene therapy, transgenic animals, bioethics', 'medium', true, false),
('Biology', 'Organisms and Populations', 35, 'Organism adaptations, population attributes, growth models', 'medium', true, false),
('Biology', 'Ecosystem', 36, 'Structure, productivity, decomposition, energy flow, nutrient cycling', 'medium', true, false),
('Biology', 'Biodiversity and Conservation', 37, 'Biodiversity levels, patterns, loss, conservation strategies', 'easy', true, false),
('Biology', 'Environmental Issues', 38, 'Pollution, solid waste, ozone depletion, deforestation', 'easy', true, false);

-- Add remaining Mathematics chapters to complete the syllabus (checking what's missing)
INSERT INTO public.chapters (subject, chapter_name, chapter_number, description, difficulty_level, is_free, is_premium) VALUES
('Mathematics', 'Mathematical Reasoning', 26, 'Statements, logical connectives, quantifiers, validity', 'easy', true, false),
('Mathematics', 'Statistics', 27, 'Mean, median, mode, variance, standard deviation', 'medium', true, false),
('Mathematics', 'Probability', 28, 'Conditional probability, Bayes theorem, random variables, distributions', 'hard', true, false),
('Mathematics', 'Linear Programming', 29, 'Graphical method, simplex method, optimization problems', 'medium', true, false)
ON CONFLICT DO NOTHING;