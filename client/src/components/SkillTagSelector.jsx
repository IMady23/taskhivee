/**
 * Skill Tag Selector Component
 * Multi-select for predefined skills
 */
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const SkillTagSelector = ({ memberId, currentSkills = [], onUpdate }) => {
  const [validSkills, setValidSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState(currentSkills);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchValidSkills();
  }, []);

  useEffect(() => {
    setSelectedSkills(currentSkills);
  }, [currentSkills]);

  const fetchValidSkills = async () => {
    try {
      // Use hardcoded skills since we don't have a backend endpoint for this
      const predefinedSkills = [
        "Frontend",
        "Backend",
        "UI",
        "Testing",
        "DevOps",
        "Database",
        "API",
        "Mobile"
      ];
      setValidSkills(predefinedSkills);
    } catch (error) {
      console.error("Error fetching valid skills:", error);
    }
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skill)) {
        return prev.filter((s) => s !== skill);
      } else {
        return [...prev, skill];
      }
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      await api.put(
        `/members/${memberId}/skills`,
        { skills: selectedSkills },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (onUpdate) {
        onUpdate(selectedSkills);
      }
    } catch (error) {
      console.error("Error updating skills:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Your Skills
      </label>

      <div className="flex flex-wrap gap-2">
        {validSkills.map((skill) => (
          <button
            key={skill}
            onClick={() => toggleSkill(skill)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedSkills.includes(skill)
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {skill}
          </button>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Skills"}
      </button>
    </div>
  );
};

export default SkillTagSelector;
