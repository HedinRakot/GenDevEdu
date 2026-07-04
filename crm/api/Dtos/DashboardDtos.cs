using DevEdu.Crm.Api.Models;

namespace DevEdu.Crm.Api.Dtos;

public record PhaseCountDto(PipelinePhase Phase, int Count);

public record DashboardDto(int Total, List<PhaseCountDto> Phases);
