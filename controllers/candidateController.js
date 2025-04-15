const Candidate = require('../models/Candidate');
const Job = require('../models/jobs');

const createCandidate = async (req, res) => {
    try {
        ['interviewStatus', 'status'].forEach(field => {
            if (req.body[field] === "") {
                delete req.body[field];
            }
        });
        const candidate = new Candidate(req.body);
        console.log("candidate req body:::::", req.body)
        await candidate.save();

        await Job.findByIdAndUpdate(candidate.job, { $push: { candidates: candidate._id } });

        res.status(201).json(candidate);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// const getCandidates = async (req, res) => {
//     try {
//         let filters = { flag: true }; // Ensure only active candidates are fetched

//         // Get all active candidates with job details
//         const candidates = await Candidate.find(filters).populate('job');

//         // Count candidates with status 'hired'
//         const hiredCount = await Candidate.countDocuments({
//             ...filters,
//             status: 'Hired'
//         });

//         res.json({
//             candidates,
//             hiredCount
//         });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

const getCandidates = async (req, res) => {
    try {
        let filters = { flag: true }; // Ensure only active candidates are fetched

        // Get all active candidates with job details
        const candidates = await Candidate.find(filters).populate('job');

        // Count candidates with status 'hired'
        const hiredCount = await Candidate.countDocuments({
            ...filters,
            status: 'Hired'
        });

        // Get candidates with interviewStatus = "Scheduled"
        const scheduledCandidates = await Candidate.find({
            ...filters,
            interviewStatus: 'Scheduled'
        }).populate('job');
        const hiredCandidates = await Candidate.find({
            ...filters,
            status: 'Hired'
        }).populate('job');

        res.json({
            candidates,
            hiredCount,
            scheduledCandidates, // New field containing scheduled candidates
            hiredCandidates,
            scheduledCount: scheduledCandidates.length // Count of scheduled candidates
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCandidateById = async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id).populate('job');
        if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// const updateCandidate = async (req, res) => {
//     try {
//         const {id}=req.params;
//         console.log("idtypeeeeeeeeeee",typeof(id));
//         const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         res.json(candidate);
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// };
const mongoose = require('mongoose');

const updateCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        console.log("idddddddd:::", typeof (id));
        // Sanitize job field
        if (updateData.job === "" || !mongoose.Types.ObjectId.isValid(updateData.job)) {
            delete updateData.job; // Remove it if it's empty or invalid
        }

        const candidate = await Candidate.findByIdAndUpdate(id, updateData, { new: true });
        res.json(candidate);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// const deleteCandidate = async (req, res) => {
//     try {
//         const candidate = await Candidate.findByIdAndDelete(req.params.id);
//         await Job.findByIdAndUpdate(candidate.job, { $pull: { candidates: candidate._id } });
//         res.json({ message: 'Candidate deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };
// Get all candidates by jobId

const deleteCandidate = async (req, res) => {
    try {
        // Find the candidate and update the flag instead of deleting
        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            { flag: false }, // Set flag to false (soft delete)
            { new: true } // Return updated document
        );

        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        // Remove candidate reference from the related Job
        await Job.findByIdAndUpdate(candidate.job, { $pull: { candidates: candidate._id } });

        res.json({ message: 'Candidate flagged as deleted successfully', candidate });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// const getCandidatesbyJobID = async (req, res) => {
//     try {
//         const { id } = req.params;
//         let filters = { flag: true };
//         console.log("hiiiiiiiii", id)
//         // Fetch candidates with matching jobId
//         const candidates = await Candidate.find({ job: id, filters });

//         if (!candidates.length) {
//             return res.status(404).json({ message: 'No candidates found for this job' });
//         }

//         res.status(200).json(candidates);
//     } catch (error) {
//         res.status(500).json({ error: 'Internal Server Error', details: error.message });
//     }
// };

const getCandidatesbyJobID = async (req, res) => {
    try {
        const { id } = req.params;
        let filters = { flag: true };
        console.log("hiiiiiiiii", id);

        // Corrected query
        const candidates = await Candidate.find({ job: id, ...filters });

        if (!candidates.length) {
            return res.status(200).json(candidates);
        }

        res.status(200).json(candidates);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

module.exports = {
    createCandidate,
    getCandidates,
    getCandidateById,
    updateCandidate,
    deleteCandidate,
    getCandidatesbyJobID
}